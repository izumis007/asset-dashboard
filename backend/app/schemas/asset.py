from pydantic import BaseModel
from typing import Optional, Literal

# ───────────────
# Enum型（Pydantic側）
# ───────────────

AssetClass = Literal['CashEq', 'FixedIncome', 'Equity', 'RealAsset', 'Crypto']
AssetType = Literal[
    'Savings', 'MMF', 'Stablecoin',
    'GovBond', 'CorpBond', 'BondETF',
    'DirectStock', 'EquityETF', 'MutualFund',
    'REIT', 'Commodity', 'GoldETF', 'Crypto'
]
Region = Literal['US', 'JP', 'EU', 'EM', 'GL']

# ───────────────
# 入力用スキーマ
# ───────────────

class AssetCreate(BaseModel):
    symbol: str
    name: str
    category: AssetClass
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
    category: AssetClass
    asset_type: Optional[AssetType]
    region: Optional[Region]
    sub_category: Optional[str]
    currency: str
    exchange: Optional[str]
    isin: Optional[str]

    class Config:
        orm_mode = True