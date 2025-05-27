from sqlalchemy import Column, Integer, String, Enum, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum

# ───────────────
# Enum定義
# ───────────────

class AssetClass(str, enum.Enum):
    CashEq = "CashEq"
    FixedIncome = "FixedIncome"
    Equity = "Equity"
    RealAsset = "RealAsset"
    Crypto = "Crypto"

class AssetType(str, enum.Enum):
    Savings = "Savings"
    MMF = "MMF"
    Stablecoin = "Stablecoin"
    GovBond = "GovBond"
    CorpBond = "CorpBond"
    BondETF = "BondETF"
    DirectStock = "DirectStock"
    EquityETF = "EquityETF"
    MutualFund = "MutualFund"
    REIT = "REIT"
    Commodity = "Commodity"
    GoldETF = "GoldETF"
    Crypto = "Crypto"

class Region(str, enum.Enum):
    US = "US"
    JP = "JP"
    EU = "EU"
    EM = "EM"
    GL = "GL"

# ───────────────
# モデル本体
# ───────────────

class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    name = Column(String(200), nullable=False)

    category = Column(Enum(AssetClass), nullable=False)
    asset_type = Column(Enum(AssetType), nullable=True)
    region = Column(Enum(Region), nullable=True)
    sub_category = Column(String(100), nullable=True)

    currency = Column(String(3), nullable=False, default="JPY")
    exchange = Column(String(50), nullable=True)
    isin = Column(String(12), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    holdings = relationship("Holding", back_populates="asset", cascade="all, delete-orphan")
    prices = relationship("Price", back_populates="asset", cascade="all, delete-orphan")

    # Unique constraint
    __table_args__ = (
        UniqueConstraint('symbol', 'category', name='_symbol_category_uc'),
    )