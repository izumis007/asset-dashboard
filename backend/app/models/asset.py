from sqlalchemy import Column, Integer, String, Enum, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.database import Base

# ───────────────
# Enum定義
# ───────────────

class AssetClass(str, enum.Enum):
    CASHEQ = "CashEq"
    FIXED_INCOME = "FixedIncome"
    EQUITY = "Equity"
    REAL_ASSET = "RealAsset"
    CRYPTO = "Crypto"

class AssetType(str, enum.Enum):
    SAVINGS = "Savings"
    MMF = "MMF"
    STABLECOIN = "Stablecoin"
    GOV_BOND = "GovBond"
    CORP_BOND = "CorpBond"
    BOND_ETF = "BondETF"
    DIRECT_STOCK = "DirectStock"
    EQUITY_ETF = "EquityETF"
    MUTUAL_FUND = "MutualFund"
    REIT = "REIT"
    COMMODITY = "Commodity"
    GOLD_ETF = "GoldETF"
    CRYPTO = "Crypto"

class Region(str, enum.Enum):
    US = "US"
    JP = "JP"
    EU = "EU"
    EM = "EM"
    GL = "GL"

# 後方互換性のための旧Enum（廃止予定）
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
    
    # 新しい分類システム
    asset_class = Column(Enum(AssetClass), nullable=True)  # 大分類
    asset_type = Column(Enum(AssetType), nullable=True)    # 中分類
    region = Column(Enum(Region), nullable=True)           # 地域分類
    
    # 旧分類システム（後方互換性のため残す）
    category = Column(Enum(AssetCategory), nullable=True)
    
    # 基本情報
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
    
    # Unique constraint on symbol + asset_type
    __table_args__ = (
        UniqueConstraint('symbol', 'asset_type', name='_symbol_asset_type_uc'),
    )
    
    @property
    def display_category(self):
        """表示用のカテゴリ（新システム優先、旧システムにフォールバック）"""
        if self.asset_class:
            return self.asset_class.value
        elif self.category:
            return self.category.value
        else:
            return "Unknown"