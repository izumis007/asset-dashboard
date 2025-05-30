from sqlalchemy import Column, Integer, String, Enum, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.database import Base

# 新しい階層化された資産分類システム
class AssetClass(str, enum.Enum):
    CASHEQ = "CASHEQ"           # 現金等価物
    FIXED_INCOME = "FIXED_INCOME" # 債券
    EQUITY = "EQUITY"           # 株式
    REAL_ASSET = "REAL_ASSET"   # 実物資産
    CRYPTO = "CRYPTO"           # 暗号資産

class AssetType(str, enum.Enum):
    # 現金等価物
    SAVINGS = "SAVINGS"         # 普通預金
    MMF = "MMF"                # マネーマーケットファンド
    STABLECOIN = "STABLECOIN"  # ステーブルコイン
    
    # 債券
    GOV_BOND = "GOV_BOND"       # 国債
    CORP_BOND = "CORP_BOND"     # 社債
    BOND_ETF = "BOND_ETF"       # 債券ETF
    
    # 株式
    DIRECT_STOCK = "DIRECT_STOCK"  # 個別株
    EQUITY_ETF = "EQUITY_ETF"      # 株式ETF
    MUTUAL_FUND = "MUTUAL_FUND"    # 投資信託
    
    # 実物資産
    REIT = "REIT"              # REIT
    COMMODITY = "COMMODITY"     # コモディティ
    GOLD_ETF = "GOLD_ETF"       # 金ETF
    
    # 暗号資産
    CRYPTO = "CRYPTO"          # 暗号資産

class Region(str, enum.Enum):
    US = "US"   # アメリカ
    JP = "JP"   # 日本
    EU = "EU"   # ヨーロッパ
    EM = "EM"   # 新興国
    DM = "DM"   # 先進国
    GL = "GL"   # グローバル

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