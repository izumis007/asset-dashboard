from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# 🔧 修正: 新しい分類システムのEnumをmodelsから直接インポート
from app.models.asset import AssetClass, AssetType, Region

# ───────────────
# 入力用スキーマ
# ───────────────

class AssetCreate(BaseModel):
    symbol: Optional[str] = None  # ティッカーは任意
    name: str
    asset_class: AssetClass  # 必須
    asset_type: Optional[AssetType] = None
    region: Optional[Region] = None
    sub_category: Optional[str] = None  # 🔧 追加: サブカテゴリ
    currency: str = "JPY"
    exchange: Optional[str] = None
    isin: Optional[str] = None

class AssetUpdate(BaseModel):
    symbol: Optional[str] = None
    name: Optional[str] = None
    asset_class: Optional[AssetClass] = None
    asset_type: Optional[AssetType] = None
    region: Optional[Region] = None
    sub_category: Optional[str] = None  # 🔧 追加: サブカテゴリ
    currency: Optional[str] = None
    exchange: Optional[str] = None
    isin: Optional[str] = None

# ───────────────
# 出力用スキーマ
# ───────────────

class AssetOut(BaseModel):
    id: str  # 🔧 修正: UUID string
    symbol: Optional[str] = None
    name: str
    asset_class: str  # 🔧 修正: Enum値をstringで返す
    asset_type: Optional[str] = None
    region: Optional[str] = None
    sub_category: Optional[str] = None  # 🔧 追加: サブカテゴリ
    currency: str
    exchange: Optional[str] = None
    isin: Optional[str] = None
    created_at: datetime  # 🔧 追加: タイムスタンプ
    updated_at: datetime

    class Config:
        from_attributes = True  # Pydantic v2

# ───────────────
# 検索用スキーマ
# ───────────────

class AssetSearchResult(BaseModel):
    """ティッカー検索結果用のスキーマ"""
    symbol: str
    name: str
    asset_class: Optional[str] = None
    asset_type: Optional[str] = None
    region: Optional[str] = None
    currency: Optional[str] = None
    exchange: Optional[str] = None

# ───────────────
# Enum選択肢用スキーマ
# ───────────────

class EnumOption(BaseModel):
    value: str
    label: str

class AssetEnumsResponse(BaseModel):
    asset_classes: list[EnumOption]
    asset_types: list[EnumOption]
    regions: list[EnumOption]

# ───────────────
# バルク操作用スキーマ
# ───────────────

class AssetBulkCreate(BaseModel):
    assets: list[AssetCreate]

class AssetBulkResponse(BaseModel):
    created: int
    errors: list[str]
    created_assets: list[AssetOut]