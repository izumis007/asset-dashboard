from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List
from datetime import date, timedelta

from app.database import get_db
from app.models import Price, Asset, User
from app.api.auth import get_current_user
from app.services.price_fetcher import PriceFetcher
from pydantic import BaseModel

router = APIRouter()

# Pydantic models
class PriceResponse(BaseModel):
    id: int
    asset_id: int
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
    asset_id: int
    start_date: date | None = None
    end_date: date | None = None

# Routes
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
            latest_prices[asset.symbol] = {
                "asset_id": asset.id,
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
    
    # Get prices
    result = await db.execute(
        select(Price)
        .where(
            and_(
                Price.asset_id == request.asset_id,
                Price.date >= request.start_date,
                Price.date <= request.end_date
            )
        )
        .order_by(Price.date)
    )
    prices = result.scalars().all()
    
    return [
        PriceResponse(
            id=price.id,
            asset_id=price.asset_id,
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
    asset_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Manually fetch current price for a specific asset"""
    # Get asset
    result = await db.execute(
        select(Asset).where(Asset.id == asset_id)
    )
    asset = result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Check if we already have today's price
    today = date.today()
    result = await db.execute(
        select(Price).where(
            and_(
                Price.asset_id == asset_id,
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
    
    if asset.category == "crypto":
        price_data = await price_fetcher.fetch_crypto_price(asset.symbol.lower())
    else:
        price_data = await price_fetcher.fetch_price(asset.symbol)
    
    if not price_data:
        raise HTTPException(status_code=503, detail="Failed to fetch price")
    
    # Save price
    price = Price(
        asset_id=asset_id,
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
    btc_data = await price_fetcher.fetch_crypto_price("bitcoin")
    if btc_data:
        rates["BTC/JPY"] = btc_data['price']
        rates["BTC/USD"] = btc_data.get('price_usd', 0)
    
    return {
        "rates": rates,
        "timestamp": datetime.now().isoformat()
    }