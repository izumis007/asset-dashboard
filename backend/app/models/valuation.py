from sqlalchemy import Column, Float, Date, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.database import Base

class ValuationSnapshot(Base):
    __tablename__ = "valuation_snapshots"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    date = Column(Date, nullable=False, unique=True, index=True)
    
    # Total values in different currencies
    total_jpy = Column(Float, nullable=False)
    total_usd = Column(Float, nullable=False)
    total_btc = Column(Float, nullable=False)
    
    # Breakdown by asset class (新しい分類システム)
    breakdown_by_category = Column(JSON, nullable=True)
    # Example: {"Equity": 5000000, "FixedIncome": 3000000, "Crypto": 2000000}
    # Note: データベースカラム名は breakdown_by_category だが、コード内では asset_class として処理
    
    # Breakdown by currency
    breakdown_by_currency = Column(JSON, nullable=True)
    # Example: {"JPY": 8000000, "USD": 2000000}
    
    # Breakdown by account type
    breakdown_by_account_type = Column(JSON, nullable=True)
    # Example: {"NISA_growth": 3000000, "iDeCo": 2000000, "specific": 5000000}
    
    # FX rates used
    fx_rates = Column(JSON, nullable=True)
    # Example: {"USD/JPY": 150.50, "BTC/JPY": 6500000}
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())