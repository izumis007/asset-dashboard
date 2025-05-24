from datetime import datetime
from typing import List, Dict, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import BTCTrade
import pandas as pd
from enum import Enum

class CostBasisMethod(str, Enum):
    FIFO = "FIFO"
    HIFO = "HIFO"

class BTCGainCalculator:
    """Calculate realized gains for BTC trades"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def calculate_realized_gain(
        self,
        sell_trade: BTCTrade,
        method: CostBasisMethod = CostBasisMethod.FIFO
    ) -> Dict:
        """Calculate realized gain for a specific sell trade"""
        
        if sell_trade.amount_btc >= 0:
            raise ValueError("Not a sell trade")
        
        # Get all buy trades before this sell
        result = await self.db.execute(
            select(BTCTrade).where(
                BTCTrade.amount_btc > 0,
                BTCTrade.timestamp < sell_trade.timestamp
            ).order_by(BTCTrade.timestamp)
        )
        buy_trades = result.scalars().all()
        
        if not buy_trades:
            raise ValueError("No buy trades found before this sell")
        
        # Sort based on method
        if method == CostBasisMethod.FIFO:
            sorted_buys = sorted(buy_trades, key=lambda x: x.timestamp)
        else:  # HIFO
            sorted_buys = sorted(buy_trades, key=lambda x: x.jpy_rate, reverse=True)
        
        # Calculate cost basis
        sell_amount = abs(sell_trade.amount_btc)
        remaining_to_match = sell_amount
        cost_basis_total = 0.0
        matched_trades = []
        
        for buy in sorted_buys:
            if remaining_to_match <= 0:
                break
            
            # Check if this buy has already been used
            used_amount = await self._get_used_amount(buy.id, sell_trade.timestamp)
            available = buy.amount_btc - used_amount
            
            if available > 0:
                match_amount = min(available, remaining_to_match)
                cost_per_btc = (buy.counter_value_jpy + buy.fee_jpy) / buy.amount_btc
                cost_basis_total += match_amount * cost_per_btc
                
                matched_trades.append({
                    "buy_id": buy.id,
                    "buy_date": buy.timestamp,
                    "amount": match_amount,
                    "rate": buy.jpy_rate,
                    "cost_per_btc": cost_per_btc
                })
                
                remaining_to_match -= match_amount
        
        if remaining_to_match > 0:
            raise ValueError(f"Insufficient buy trades to match sell of {sell_amount} BTC")
        
        # Calculate gain
        gross_proceeds = sell_trade.counter_value_jpy - sell_trade.fee_jpy
        realized_gain = gross_proceeds - cost_basis_total
        
        return {
            "sell_trade_id": sell_trade.id,
            "sell_date": sell_trade.timestamp,
            "sell_amount": sell_amount,
            "gross_proceeds": gross_proceeds,
            "cost_basis": cost_basis_total,
            "realized_gain": realized_gain,
            "method": method.value,
            "matched_trades": matched_trades
        }
    
    async def _get_used_amount(self, buy_trade_id: int, before_date: datetime) -> float:
        """Get amount of a buy trade that has been used in sells before a date"""
        # This would require a separate tracking table in production
        # For MVP, we'll calculate dynamically
        result = await self.db.execute(
            select(BTCTrade).where(
                BTCTrade.amount_btc < 0,
                BTCTrade.timestamp < before_date
            ).order_by(BTCTrade.timestamp)
        )
        sells = result.scalars().all()
        
        # Simple FIFO matching to determine used amount
        result = await self.db.execute(
            select(BTCTrade).where(
                BTCTrade.amount_btc > 0,
                BTCTrade.timestamp < before_date
            ).order_by(BTCTrade.timestamp)
        )
        buys = result.scalars().all()
        
        used_amounts = {buy.id: 0.0 for buy in buys}
        
        for sell in sells:
            remaining = abs(sell.amount_btc)
            for buy in buys:
                if buy.id == buy_trade_id:
                    available = buy.amount_btc - used_amounts[buy.id]
                    use = min(available, remaining)
                    used_amounts[buy.id] += use
                    remaining -= use
                if remaining <= 0:
                    break
        
        return used_amounts.get(buy_trade_id, 0.0)
    
    async def generate_gain_report(
        self,
        year: int,
        method: CostBasisMethod = CostBasisMethod.FIFO
    ) -> pd.DataFrame:
        """Generate annual realized gain report"""
        
        # Get all sells for the year
        start_date = datetime(year, 1, 1)
        end_date = datetime(year, 12, 31, 23, 59, 59)
        
        result = await self.db.execute(
            select(BTCTrade).where(
                BTCTrade.amount_btc < 0,
                BTCTrade.timestamp >= start_date,
                BTCTrade.timestamp <= end_date
            ).order_by(BTCTrade.timestamp)
        )
        sell_trades = result.scalars().all()
        
        report_data = []
        
        for sell in sell_trades:
            try:
                gain_calc = await self.calculate_realized_gain(sell, method)
                
                report_data.append({
                    "Date": sell.timestamp.strftime("%Y-%m-%d"),
                    "Amount (BTC)": abs(sell.amount_btc),
                    "Gross Proceeds (JPY)": gain_calc["gross_proceeds"],
                    "Cost Basis (JPY)": gain_calc["cost_basis"],
                    "Realized Gain (JPY)": gain_calc["realized_gain"],
                    "Exchange": sell.exchange or "Unknown",
                    "Method": method.value
                })
            except Exception as e:
                print(f"Error calculating gain for trade {sell.id}: {e}")
        
        df = pd.DataFrame(report_data)
        
        # Add summary row
        if not df.empty:
            summary = pd.DataFrame([{
                "Date": "TOTAL",
                "Amount (BTC)": df["Amount (BTC)"].sum(),
                "Gross Proceeds (JPY)": df["Gross Proceeds (JPY)"].sum(),
                "Cost Basis (JPY)": df["Cost Basis (JPY)"].sum(),
                "Realized Gain (JPY)": df["Realized Gain (JPY)"].sum(),
                "Exchange": "",
                "Method": method.value
            }])
            df = pd.concat([df, summary], ignore_index=True)
        
        return df