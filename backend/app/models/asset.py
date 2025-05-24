from sqlalchemy import Column, Integer, String, Enum, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.database import Base

class AssetCategory(str, enum.Enum):
    EQUITY = "equity"
    ETF = "etf"
    FUND = "fund"
    BOND = "bond"
    CRYPTO = "crypto"
    CASH = "cash"

class Asset(Base):
    __tablename__ = "assets"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    category = Column(Enum(AssetCategory), nullable=False)
    currency = Column(String(3), nullable=False, default="JPY")
    
    # Optional fields
    exchange = Column(String(50), nullable=True)
    isin = Column(String(12), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    holdings = relationship("Holding", back_populates="asset", cascade="all, delete-orphan")
    prices = relationship("Price", back_populates="asset", cascade="all, delete-orphan")
    
    # Unique constraint on symbol + category
    __table_args__ = (
        UniqueConstraint('symbol', 'category', name='_symbol_category_uc'),
    )