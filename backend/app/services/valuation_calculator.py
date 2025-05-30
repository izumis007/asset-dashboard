from datetime import date, datetime
from typing import Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
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
        breakdown_by_asset_class = {}  # 変数名変更
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
            asset_class = holding.asset.asset_class.value  # 変更: categoryからasset_classに
            breakdown_by_asset_class[asset_class] = breakdown_by_asset_class.get(asset_class, 0) + value_jpy
            
            currency = holding.asset.currency
            breakdown_by_currency[currency] = breakdown_by_currency.get(currency, 0) + value_in_currency
            
            account_type = holding.account_type.value
            breakdown_by_account_type[account_type] = breakdown_by_account_type.get(account_type, 0) + value_jpy
        
        # Add cash balances
        cash_result = await self.db.execute(
            select(CashBalance).where(
                func.date(CashBalance.timestamp) <= target_date
            ).order_by(CashBalance.institution, CashBalance.timestamp.desc())
        )
        cash_balances = cash_result.scalars().all()
        
        # Get latest balance per institution
        seen_institutions = set()
        for balance in cash_balances:
            if balance.institution not in seen_institutions:
                seen_institutions.add(balance.institution)
                
                if balance.currency == "JPY":
                    value_jpy = balance.amount
                else:
                    fx_rate = fx_rates.get(f"{balance.currency}/JPY", 0)
                    value_jpy = balance.amount * fx_rate if fx_rate > 0 else 0
                
                total_jpy += value_jpy
                breakdown_by_asset_class["CashEq"] = breakdown_by_asset_class.get("CashEq", 0) + value_jpy  # 変更: "cash" → "CashEq"
                breakdown_by_currency[balance.currency] = breakdown_by_currency.get(balance.currency, 0) + balance.amount
        
        # Calculate BTC position
        btc_result = await self.db.execute(
            select(func.sum(BTCTrade.amount_btc)).where(
                BTCTrade.timestamp <= datetime.combine(target_date, datetime.max.time())
            )
        )
        total_btc = btc_result.scalar() or 0
        
        # Convert totals
        total_usd = total_jpy / fx_rates.get("USD/JPY", 150) if fx_rates.get("USD/JPY") else 0
        
        # Create snapshot
        snapshot = ValuationSnapshot(
            date=target_date,
            total_jpy=total_jpy,
            total_usd=total_usd,
            total_btc=total_btc,
            breakdown_by_asset_class=breakdown_by_asset_class,  # 変更: breakdown_by_categoryからbreakdown_by_asset_classに
            breakdown_by_currency=breakdown_by_currency,
            breakdown_by_account_type=breakdown_by_account_type,
            fx_rates=fx_rates
        )
        
        return snapshot
    
    async def _get_latest_price(self, asset: Asset, target_date: date) -> Optional[float]:
        """Get the latest price for an asset up to target date"""
        result = await self.db.execute(
            select(Price).where(
                Price.asset_id == asset.id,
                Price.date <= target_date
            ).order_by(Price.date.desc()).limit(1)
        )
        price_record = result.scalar_one_or_none()
        
        if price_record:
            return price_record.price
        
        # If no price in database, try to fetch current price
        if target_date == date.today():
            if asset.asset_class.value == "Crypto":  # 変更: asset.categoryからasset.asset_class.valueに
                price_data = await self.price_fetcher.fetch_crypto_price(asset.symbol.lower())
            else:
                price_data = await self.price_fetcher.fetch_price(asset.symbol)
            
            if price_data:
                return price_data['price']
        
        return None
    
    async def _get_fx_rates(self) -> Dict[str, float]:
        """Get current FX rates"""
        rates = {}
        
        # Fetch major currency pairs
        pairs = [
            ("USD", "JPY"),
            ("EUR", "JPY"),
            ("GBP", "JPY"),
            ("BTC", "JPY")
        ]
        
        for from_curr, to_curr in pairs:
            if from_curr == "BTC":
                # Get BTC price from CoinGecko
                btc_data = await self.price_fetcher.fetch_crypto_price("bitcoin")
                if btc_data:
                    rates[f"{from_curr}/{to_curr}"] = btc_data['price']
            else:
                rate = await self.price_fetcher.fetch_fx_rate(from_curr, to_curr)
                if rate:
                    rates[f"{from_curr}/{to_curr}"] = rate
        
        return rates