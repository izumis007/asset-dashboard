from datetime import date, datetime
from typing import Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models import Asset, Holding, Price, ValuationSnapshot, CashBalance, BTCTrade
from app.services.price_fetcher import PriceFetcher
import logging

logger = logging.getLogger(__name__)

class ValuationCalculator:
    """Calculate portfolio valuation and breakdowns"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.price_fetcher = PriceFetcher()
    
    async def calculate_snapshot(self, target_date: date = None) -> Optional[ValuationSnapshot]:
        """Calculate valuation snapshot for a specific date"""
        if not target_date:
            target_date = date.today()
        
        # Check if snapshot already exists
        result = await self.db.execute(
            select(ValuationSnapshot).where(ValuationSnapshot.date == target_date)
        )
        if result.scalar_one_or_none():
            logger.info(f"Snapshot already exists for {target_date}")
            return None
        
        # Get FX rates
        fx_rates = await self._get_fx_rates()
        
        # Calculate valuations
        total_jpy = 0.0
        breakdown_by_category = {}
        breakdown_by_currency = {}
        breakdown_by_account_type = {}
        
        # Process holdings
        result = await self.db.execute(
            select(Holding).options(
                selectinload(Holding.asset)
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
            
            # Update breakdowns
            category = holding.asset.category.value
            breakdown_by_category[category] = breakdown_by_category.get(category, 0) + value_jpy
            
            currency = holding.asset.currency
            breakdown_by_currency[currency] = breakdown_by_currency.get(currency, 0) + value_in_currency
            
            account_type = holding.