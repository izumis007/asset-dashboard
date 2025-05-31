from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from typing import List, Dict
from datetime import date, timedelta, datetime
import uuid

from app.database import get_db
from app.models import Price, Asset, User, Holding
from app.api.auth import get_current_user
from app.services.price_fetcher import PriceFetcher
from pydantic import BaseModel

router = APIRouter()

# Pydantic models
class PriceResponse(BaseModel):
    id: str
    asset_id: str
    date: date
    price: float
    open: float | None
    high: float | None
    low: float | None
    volume: float | None
    source: str | None
    
    class Config:
        from_attributes = True

class PriceHistoryRequest(BaseModel):
    asset_id: str
    start_date: date | None = None
    end_date: date | None = None

class CurrentPricesResponse(BaseModel):
    prices: Dict[str, Dict]
    last_updated: str
    fx_rates: Dict[str, float]

# Routes
@router.get("/current", response_model=CurrentPricesResponse)
async def get_current_prices(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """保有資産の現在価格を一括取得"""
    
    # 保有資産から必要な価格データを特定
    result = await db.execute(
        select(Holding).options(
            selectinload(Holding.asset)
        ).distinct(Holding.asset_id)
    )
    holdings = result.scalars().all()
    
    if not holdings:
        return CurrentPricesResponse(
            prices={},
            last_updated=datetime.now().isoformat(),
            fx_rates={}
        )
    
    # 価格取得対象のアセット情報を収集
    price_fetcher = PriceFetcher()
    symbols_to_fetch = []
    asset_map = {}
    
    for holding in holdings:
        asset = holding.asset
        if asset.symbol:  # シンボルがある場合のみ価格取得
            symbols_to_fetch.append((
                asset.symbol,
                asset.asset_class.value,
                asset.currency
            ))
            asset_map[asset.symbol] = {
                "id": str(asset.id),
                "name": asset.name,
                "currency": asset.currency,
                "asset_class": asset.asset_class.value
            }
    
    # 並列で価格取得
    price_results = await price_fetcher.fetch_multiple_prices(symbols_to_fetch)
    
    # 為替レート取得
    fx_rates = {}
    currencies = set(asset["currency"] for asset in asset_map.values())
    for currency in currencies:
        if currency != "JPY":
            rate = await price_fetcher.fetch_fx_rate(currency, "JPY")
            if rate:
                fx_rates[f"{currency}/JPY"] = rate
    
    # BTC価格も取得
    btc_data = await price_fetcher._fetch_crypto_price("bitcoin")
    if btc_data:
        fx_rates["BTC/JPY"] = btc_data['price']
        fx_rates["BTC/USD"] = btc_data.get('price_usd', 0)
    
    # レスポンス構築
    current_prices = {}
    today = date.today()
    
    for symbol, price_data in price_results.items():
        if price_data and symbol in asset_map:
            asset_info = asset_map[symbol]
            
            # DBに価格を保存（今日の分がまだない場合）
            try:
                asset_uuid = uuid.UUID(asset_info["id"])
                existing = await db.execute(
                    select(Price).where(
                        and_(
                            Price.asset_id == asset_uuid,
                            Price.date == today
                        )
                    )
                )
                
                if not existing.scalar_one_or_none():
                    new_price = Price(
                        asset_id=asset_uuid,
                        date=price_data['date'],
                        price=price_data['price'],
                        open=price_data.get('open'),
                        high=price_data.get('high'),
                        low=price_data.get('low'),
                        volume=price_data.get('volume'),
                        source=price_data.get('source')
                    )
                    db.add(new_price)
                
                # レスポンスに追加
                current_prices[symbol] = {
                    "asset_id": asset_info["id"],
                    "symbol": symbol,
                    "name": asset_info["name"],
                    "price": price_data['price'],
                    "currency": asset_info["currency"],
                    "asset_class": asset_info["asset_class"],
                    "change_24h": price_data.get('change_24h'),
                    "date": price_data['date'].isoformat(),
                    "source": price_data.get('source')
                }
                
            except Exception as e:
                logger.error(f"Error saving price for {symbol}: {e}")
    
    # DBの変更をコミット
    try:
        await db.commit()
    except Exception as e:
        logger.error(f"Error committing prices: {e}")
        await db.rollback()
    
    return CurrentPricesResponse(
        prices=current_prices,
        last_updated=datetime.now().isoformat(),
        fx_rates=fx_rates
    )

@router.get("/latest")
async def get_latest_prices(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get latest prices for all assets"""
    # Get all assets
    result = await db.execute(select(Asset))
    assets = result.scalars().all()
    
    latest_prices = {}
    
    for asset in assets:
        # Get latest price for each asset
        result = await db.execute(
            select(Price)
            .where(Price.asset_id == asset.id)
            .order_by(Price.date.desc())
            .limit(1)
        )
        price = result.scalar_one_or_none()
        
        if price:
            latest_prices[asset.symbol or str(asset.id)] = {
                "asset_id": str(asset.id),
                "symbol": asset.symbol,
                "name": asset.name,
                "price": price.price,
                "date": price.date.isoformat(),
                "currency": asset.currency,
                "source": price.source
            }
    
    return latest_prices

@router.post("/history", response_model=List[PriceResponse])
async def get_price_history(
    request: PriceHistoryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get price history for a specific asset"""
    # Default date range if not provided
    if not request.end_date:
        request.end_date = date.today()
    if not request.start_date:
        request.start_date = request.end_date - timedelta(days=365)
    
    try:
        asset_uuid = uuid.UUID(request.asset_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid asset ID format")
    
    # Get prices
    result = await db.execute(
        select(Price)
        .where(
            and_(
                Price.asset_id == asset_uuid,
                Price.date >= request.start_date,
                Price.date <= request.end_date
            )
        )
        .order_by(Price.date)
    )
    prices = result.scalars().all()
    
    return [
        PriceResponse(
            id=str(price.id),
            asset_id=str(price.asset_id),
            date=price.date,
            price=price.price,
            open=price.open,
            high=price.high,
            low=price.low,
            volume=price.volume,
            source=price.source
        )
        for price in prices
    ]

@router.post("/fetch/{asset_id}")
async def fetch_price(
    asset_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Manually fetch current price for a specific asset"""
    try:
        asset_uuid = uuid.UUID(asset_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid asset ID format")
    
    # Get asset
    result = await db.execute(
        select(Asset).where(Asset.id == asset_uuid)
    )
    asset = result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    if not asset.symbol:
        raise HTTPException(status_code=400, detail="Asset has no symbol for price fetching")
    
    # Check if we already have today's price
    today = date.today()
    result = await db.execute(
        select(Price).where(
            and_(
                Price.asset_id == asset_uuid,
                Price.date == today
            )
        )
    )
    existing_price = result.scalar_one_or_none()
    
    if existing_price:
        return {
            "message": "Price already exists for today",
            "price": existing_price.price,
            "date": existing_price.date.isoformat()
        }
    
    # Fetch new price
    price_fetcher = PriceFetcher()
    
    if asset.asset_class and asset.asset_class.value == "Crypto":
        price_data = await price_fetcher._fetch_crypto_price(asset.symbol.lower())
    else:
        price_data = await price_fetcher.fetch_price(
            asset.symbol, 
            asset.asset_class.value if asset.asset_class else "Equity",
            asset.currency
        )
    
    if not price_data:
        raise HTTPException(status_code=503, detail="Failed to fetch price")
    
    # Save price
    price = Price(
        asset_id=asset_uuid,
        date=price_data['date'],
        price=price_data['price'],
        open=price_data.get('open'),
        high=price_data.get('high'),
        low=price_data.get('low'),
        volume=price_data.get('volume'),
        source=price_data.get('source')
    )
    db.add(price)
    await db.commit()
    
    return {
        "message": "Price fetched successfully",
        "price": price.price,
        "date": price.date.isoformat(),
        "source": price.source
    }

@router.get("/fx-rates")
async def get_fx_rates(
    current_user: User = Depends(get_current_user)
):
    """Get current foreign exchange rates"""
    price_fetcher = PriceFetcher()
    
    rates = {}
    pairs = [
        ("USD", "JPY"),
        ("EUR", "JPY"),
        ("GBP", "JPY")
    ]
    
    for from_curr, to_curr in pairs:
        rate = await price_fetcher.fetch_fx_rate(from_curr, to_curr)
        if rate:
            rates[f"{from_curr}/{to_curr}"] = rate
    
    # Get BTC price
    btc_data = await price_fetcher._fetch_crypto_price("bitcoin")
    if btc_data:
        rates["BTC/JPY"] = btc_data['price']
        rates["BTC/USD"] = btc_data.get('price_usd', 0)
    
    return {
        "rates": rates,
        "timestamp": datetime.now().isoformat()
    }