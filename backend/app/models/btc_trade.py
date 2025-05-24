from sqlalchemy import Column, Integer, Float, DateTime, String, Text
from sqlalchemy.sql import func
from app.database import Base

class BTCTrade(Base):
    __tablename__ = "btc_trades"
    
    id = Column(Integer, primary_key=True, index=True)
    txid = Column(String(100), nullable=True, unique=True)  # Transaction ID if available
    amount_btc = Column(Float, nullable=False)  # Positive for buy, negative for sell
    counter_value_jpy = Column(Float, nullable=False)  # JPY amount (always positive)
    jpy_rate = Column(Float, nullable=False)  # JPY per BTC at time of trade
    fee_btc = Column(Float, nullable=True, default=0)
    fee_jpy = Column(Float, nullable=True, default=0)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    
    # Optional fields
    exchange = Column(String(100), nullable=True)
    trade_type = Column(String(10), nullable=True)  # "buy" or "sell"
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    @property
    def is_buy(self):
        return self.amount_btc > 0