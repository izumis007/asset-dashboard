from datetime import datetime, date
from typing import Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
import logging

from app.models import Holding, Asset, Price, ValuationSnapshot, BTCTrade
from app.services.price_fetcher import PriceFetcher

logger = logging.getLogger(__name__)

class ValuationCalculator:
    """Calculate portfolio valuations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.price_fetcher = PriceFetcher()
    
    async def calculate_snapshot(self, target_date: date = None) -> Optional[ValuationSnapshot]:
        """Calculate valuation snapshot for a specific date"""
        if target_date is None:
            target_date = date.today()
        
        # Get FX rates
        fx_rates = await self._get_fx_rates()
        
        # Calculate valuations
        total_jpy = 0.0
        breakdown_by_category = {}  # データベースカラム名と一致
        breakdown_by_currency = {}
        breakdown_by_account_type = {}
        
        # Process holdings with proper relationships
        result = await self.db.execute(
            select(Holding).options(
                selectinload(Holding.asset),
                selectinload(Holding.owner)  # 名義人情報も含める
            )
        )
        holdings = result.scalars().all()
        
        for holding in holdings:
            # Get latest price
            price = await self._get_latest_price(holding.asset, target_date)
            if not price:
                logger.warning(f"No price found for {holding.asset.symbol}")
                continue
            
            # Calculate value in asset currency
            value_in_currency = holding.quantity * price
            
            # Convert to JPY
            if holding.asset.currency == "JPY":
                value_jpy = value_in_currency
            else:
                fx_rate = fx_rates.get(f"{holding.asset.currency}/JPY", 0)
                if fx_rate == 0:
                    logger.warning(f"No FX rate for {holding.asset.currency}/JPY")
                    continue
                value_jpy = value_in_currency * fx_rate
            
            # Update totals
            total_jpy += value_jpy
            
            # Update breakdowns - データベースカラム名と一致
            asset_class = holding.asset.asset_class.value
            breakdown_by_category[asset_class] = breakdown_by_category.get(asset_class, 0) + value_jpy
            
            currency = holding.asset.currency
            breakdown_by_currency[currency] = breakdown_by_currency.get(currency, 0) + value_in_currency
            
            account_type = holding.account_type.value
            breakdown_by_account_type[account_type] = breakdown_by_account_type.get(account_type, 0) + value_jpy
        
        # Calculate BTC holdings
        total_btc = await self._calculate_btc_holdings()
        
        # Calculate USD equivalent
        usd_jpy_rate = fx_rates.get("USD/JPY", 150.0)  # Default fallback
        total_usd = total_jpy / usd_jpy_rate if usd_jpy_rate > 0 else 0
        
        # Create snapshot
        snapshot = ValuationSnapshot(
            date=target_date,
            total_jpy=total_jpy,
            total_usd=total_usd,
            total_btc=total_btc,
            breakdown_by_category=breakdown_by_category,  # データベースカラム名
            breakdown_by_currency=breakdown_by_currency,
            breakdown_by_account_type=breakdown_by_account_type,
            fx_rates=fx_rates
        )
        
        return snapshot
    
    async def _get_latest_price(self, asset: Asset, target_date: date) -> Optional[float]:
        """Get latest price for an asset"""
        # First try to get price from database
        result = await self.db.execute(
            select(Price)
            .where(Price.asset_id == asset.id)
            .where(Price.date <= target_date)
            .order_by(Price.date.desc())
            .limit(1)
        )
        price_record = result.scalar_one_or_none()
        
        if price_record:
            return price_record.price
        
        # If no price in database, try to fetch
        if asset.asset_class.value == "Crypto":
            price_data = await self.price_fetcher.fetch_crypto_price(asset.symbol.lower())
        else:
            price_data = await self.price_fetcher.fetch_price(asset.symbol)
        
        if price_data:
            # Save fetched price
            new_price = Price(
                asset_id=asset.id,
                date=price_data['date'],
                price=price_data['price'],
                open=price_data.get('open'),
                high=price_data.get('high'),
                low=price_data.get('low'),
                volume=price_data.get('volume'),
                source=price_data.get('source')
            )
            self.db.add(new_price)
            await self.db.commit()
            return price_data['price']
        
        return None
    
    async def _get_fx_rates(self) -> Dict[str, float]:
        """Get current FX rates"""
        rates = {}
        
        # Get major FX rates
        for from_curr, to_curr in [("USD", "JPY"), ("EUR", "JPY"), ("GBP", "JPY")]:
            rate = await self.price_fetcher.fetch_fx_rate(from_curr, to_curr)
            if rate:
                rates[f"{from_curr}/{to_curr}"] = rate
        
        # Get crypto rates
        btc_data = await self.price_fetcher.fetch_crypto_price("bitcoin")
        if btc_data:
            rates["BTC/JPY"] = btc_data['price']
            rates["BTC/USD"] = btc_data.get('price_usd', 0)
        
        return rates
    
    async def _calculate_btc_holdings(self) -> float:
        """Calculate total BTC holdings from trades"""
        result = await self.db.execute(
            select(func.sum(BTCTrade.amount_btc))
        )
        total_btc = result.scalar()
        return total_btc or 0.0