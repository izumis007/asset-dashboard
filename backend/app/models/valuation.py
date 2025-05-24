from sqlalchemy import Column, Integer, Float, Date, DateTime, JSON
from sqlalchemy.sql import func
from app.database import Base

class ValuationSnapshot(Base):
    __tablename__ = "valuation_snapshots"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, unique=True, index=True)
    
    # Total values in different currencies
    total_jpy = Column(Float, nullable=False)
    total_usd = Column(Float, nullable=False)
    total_btc = Column(Float, nullable=False)
    
    # Breakdown by asset category
    breakdown_by_category = Column(JSON, nullable=True)
    # Example: {"equity": 5000000, "etf": 3000000, "crypto": 2000000}
    
    # Breakdown by currency
    breakdown_by_currency = Column(JSON, nullable=True)
    # Example: {"JPY": 8000000, "USD": 2000000}
    
    # Breakdown by account type
    breakdown_by_account_type = Column(JSON, nullable=True)
    # Example: {"NISA": 3000000, "iDeCo": 2000000, "taxable": 5000000}
    
    # FX rates used
    fx_rates = Column(JSON, nullable=True)
    # Example: {"USD/JPY": 150.50, "BTC/JPY": 6500000}
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())