from sqlalchemy import Column, Integer, String, Enum, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.database import Base

# 新しい階層化された資産分類システム
class AssetClass(str, enum.Enum):
    CASH_EQUIVALENTS = "CashEquivalents"
    FIXED_INCOME = "FixedIncome"
    EQUITY = "Equity"
    REAL_ESTATE = "RealEstate"
    COMMODITY = "Commodity"
    CRYPTO = "Crypto"

class AssetType(str, enum.Enum):
    # CashEquivalents
    SAVINGS = "Savings"
    MMF = "MMF"
    STABLECOIN = "Stablecoin"
    
    # FixedIncome
    GOVERNMENT_BOND = "GovernmentBond"
    CORPORATE_BOND = "CorporateBond"
    BOND_ETF = "BondETF"
    BOND_MUTUAL_FUND = "BondMutualFund"
    
    # Equity
    DIRECT_STOCK = "DirectStock"
    EQUITY_ETF = "EquityETF"
    MUTUAL_FUND = "MutualFund"
    ADR = "ADR"
    
    # RealEstate
    REIT = "REIT"
    
    # Commodity
    GOLD_ETF = "GoldETF"
    COMMODITY_ETF = "CommodityETF"
    PHYSICAL_GOLD = "PhysicalGold"
    
    # Crypto
    CRYPTO = "Crypto"
    CRYPTO_ETF = "CryptoETF"

class Region(str, enum.Enum):
    JP = "JP"
    US = "US"
    EU = "EU"
    EM = "EM"
    GL = "GL"

# 型の依存関係を定義
ASSET_TYPE_MAPPING = {
    AssetClass.CASH_EQUIVALENTS: [AssetType.SAVINGS, AssetType.MMF, AssetType.STABLECOIN],
    AssetClass.FIXED_INCOME: [AssetType.GOVERNMENT_BOND, AssetType.CORPORATE_BOND, AssetType.BOND_ETF, AssetType.BOND_MUTUAL_FUND],
    AssetClass.EQUITY: [AssetType.DIRECT_STOCK, AssetType.EQUITY_ETF, AssetType.MUTUAL_FUND, AssetType.ADR],
    AssetClass.REAL_ESTATE: [AssetType.REIT],
    AssetClass.COMMODITY: [AssetType.GOLD_ETF, AssetType.COMMODITY_ETF, AssetType.PHYSICAL_GOLD],
    AssetClass.CRYPTO: [AssetType.CRYPTO, AssetType.CRYPTO_ETF]
}

class Asset(Base):
    __tablename__ = "assets"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    
    # 新しい階層化された分類システム
    asset_class = Column(Enum(AssetClass), nullable=False)
    asset_type = Column(Enum(AssetType), nullable=True)
    region = Column(Enum(Region), nullable=True)
    sub_category = Column(String(100), nullable=True)  # ←追加
    
    # 基本情報
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
        UniqueConstraint('symbol', 'asset_type', name='_symbol_asset_type_uc'),
    )
    
    def validate_asset_type(self):
        """資産タイプが資産クラスに適合するかチェック"""
        if self.asset_type and self.asset_type not in ASSET_TYPE_MAPPING.get(self.asset_class, []):
            raise ValueError(f"Asset type {self.asset_type} is not valid for asset class {self.asset_class}")
    
    @property
    def display_category(self):
        """表示用のカテゴリ"""
        return self.asset_class.value if self.asset_class else "Unknown"