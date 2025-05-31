from sqlalchemy import Column, String, Enum, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
import uuid
from app.database import Base

# 新しい階層化された資産分類システム（データベーススキーマと完全一致）
class AssetClass(str, enum.Enum):
    CashEq = "CashEq"           # 現金等価物
    FixedIncome = "FixedIncome" # 債券
    Equity = "Equity"           # 株式
    RealAsset = "RealAsset"     # 実物資産
    Crypto = "Crypto"           # 暗号資産

class AssetType(str, enum.Enum):
    # 現金等価物
    Savings = "Savings"         # 普通預金
    MMF = "MMF"                # マネーマーケットファンド
    Stablecoin = "Stablecoin"  # ステーブルコイン
    
    # 債券
    GovBond = "GovBond"       # 国債
    CorpBond = "CorpBond"     # 社債
    BondETF = "BondETF"       # 債券ETF
    
    # 株式
    DirectStock = "DirectStock"  # 個別株
    EquityETF = "EquityETF"      # 株式ETF
    MutualFund = "MutualFund"    # 投資信託
    
    # 実物資産
    REIT = "REIT"              # REIT
    Commodity = "Commodity"     # コモディティ
    GoldETF = "GoldETF"       # 金ETF
    
    # 暗号資産
    Crypto = "Crypto"          # 暗号資産

class Region(str, enum.Enum):
    US = "US"   # アメリカ
    JP = "JP"   # 日本
    EU = "EU"   # ヨーロッパ
    EM = "EM"   # 新興国
    DM = "DM"   # 先進国
    GL = "GL"   # グローバル

class Asset(Base):
    __tablename__ = "assets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    symbol = Column(String(20), nullable=True, index=True)  # ティッカーは任意
    name = Column(String(200), nullable=False)
    
    # 新しい階層化された分類システム
    asset_class = Column(Enum(AssetClass), nullable=False)  # 必須
    asset_type = Column(Enum(AssetType), nullable=True)
    region = Column(Enum(Region), nullable=True)
    sub_category = Column(String(100), nullable=True)  # サブカテゴリ追加
    
    # 基本情報
    currency = Column(String(3), nullable=False, default="JPY")
    exchange = Column(String(50), nullable=True)
    isin = Column(String(12), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    holdings = relationship("Holding", back_populates="asset", cascade="all, delete-orphan")
    prices = relationship("Price", back_populates="asset", cascade="all, delete-orphan")
    
    # Unique constraint
    __table_args__ = (
        UniqueConstraint('symbol', 'asset_type', name='_symbol_asset_type_uc'),
    )
    
    @property
    def display_category(self):
        """表示用のカテゴリ"""
        return self.asset_class.value if self.asset_class else "Unknown"