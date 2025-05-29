from pydantic import BaseModel
from typing import Optional
from enum import Enum

# ───────────────
# Enum 定義
# ───────────────

class AssetClass(str, Enum):
    CashEq = "CashEq"
    FixedIncome = "FixedIncome"
    Equity = "Equity"
    RealAsset = "RealAsset"
    Crypto = "Crypto"

class AssetType(str, Enum):
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

class Region(str, Enum):
    US = "US"
    JP = "JP"
    EU = "EU"
    EM = "EM"
    GL = "GL"

# ───────────────
# 入力用スキーマ
# ───────────────

class AssetCreate(BaseModel):
    symbol: str
    name: str
    asset_class: AssetClass
    asset_type: Optional[AssetType] = None
    region: Optional[Region] = None
    sub_category: Optional[str] = None
    currency: Optional[str] = "JPY"
    exchange: Optional[str] = None
    isin: Optional[str] = None

# ───────────────
# 出力用スキーマ
# ───────────────

class AssetOut(BaseModel):
    id: int
    symbol: str
    name: str
    asset_class: AssetClass
    asset_type: Optional[AssetType]
    region: Optional[Region]
    sub_category: Optional[str]
    currency: str
    exchange: Optional[str]
    isin: Optional[str]

    class Config:
        from_attributes = True  # Pydantic v2
        # orm_mode = True       # Pydantic v1の場合はこちら