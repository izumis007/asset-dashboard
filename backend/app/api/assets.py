from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import logging
import traceback
import uuid  # 🔧 追加: uuid インポート
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import Asset, User
from app.api.auth import get_current_user
from pydantic import BaseModel
from app.models.asset import AssetClass, AssetType, Region

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic models
class AssetCreate(BaseModel):
    symbol: Optional[str] = None  # ティッカーは任意
    name: str
    asset_class: AssetClass  # 必須
    asset_type: Optional[AssetType] = None
    region: Optional[Region] = None
    sub_category: Optional[str] = None  # サブカテゴリ追加
    currency: str = "JPY"
    exchange: Optional[str] = None
    isin: Optional[str] = None

class AssetUpdate(BaseModel):
    symbol: Optional[str] = None
    name: Optional[str] = None
    asset_class: Optional[AssetClass] = None
    asset_type: Optional[AssetType] = None
    region: Optional[Region] = None
    sub_category: Optional[str] = None  # サブカテゴリ追加
    exchange: Optional[str] = None
    isin: Optional[str] = None
    currency: Optional[str] = None

class AssetResponse(BaseModel):
    id: str  # UUID string
    symbol: Optional[str] = None
    name: str
    asset_class: str  # 必須
    asset_type: Optional[str] = None
    region: Optional[str] = None
    sub_category: Optional[str] = None  # サブカテゴリ追加
    currency: str
    exchange: Optional[str] = None
    isin: Optional[str] = None

    class Config:
        from_attributes = True

# Routes
@router.get("/", response_model=List[AssetResponse])
async def get_assets(
    asset_class: Optional[AssetClass] = None,
    asset_type: Optional[AssetType] = None,
    region: Optional[Region] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        logger.info("Starting get_assets")
        
        query = select(Asset)
        if asset_class:
            query = query.where(Asset.asset_class == asset_class)
        if asset_type:
            query = query.where(Asset.asset_type == asset_type)
        if region:
            query = query.where(Asset.region == region)

        result = await db.execute(query.order_by(Asset.name))
        assets = result.scalars().all()
        
        logger.info(f"Found {len(assets)} assets")
        
        response_list = []
        for a in assets:
            try:
                asset_response = AssetResponse(
                    id=str(a.id),  # UUID to string
                    symbol=a.symbol,
                    name=a.name,
                    asset_class=a.asset_class.value,
                    asset_type=a.asset_type.value if a.asset_type else None,
                    region=a.region.value if a.region else None,
                    sub_category=a.sub_category,  # サブカテゴリ追加
                    currency=a.currency,
                    exchange=a.exchange,
                    isin=a.isin,
                )
                response_list.append(asset_response)
            except Exception as e:
                logger.error(f"Error processing asset {a.id}: {str(e)}")
                continue
        
        logger.info(f"Successfully processed {len(response_list)} assets")
        return response_list
        
    except Exception as e:
        logger.error(f"Error in get_assets: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/", response_model=AssetResponse)
async def create_asset(
    asset_data: AssetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        # 重複チェック（symbolとasset_typeの組み合わせ）
        if asset_data.symbol and asset_data.asset_type:
            result = await db.execute(
                select(Asset).where(
                    Asset.symbol == asset_data.symbol,
                    Asset.asset_type == asset_data.asset_type
                )
            )
            if result.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Asset already exists")

        asset = Asset(**asset_data.dict())
        db.add(asset)
        await db.commit()
        await db.refresh(asset)

        return AssetResponse(
            id=str(asset.id),
            symbol=asset.symbol,
            name=asset.name,
            asset_class=asset.asset_class.value,
            asset_type=asset.asset_type.value if asset.asset_type else None,
            region=asset.region.value if asset.region else None,
            sub_category=asset.sub_category,  # サブカテゴリ追加
            currency=asset.currency,
            exchange=asset.exchange,
            isin=asset.isin,
        )
    except Exception as e:
        logger.error(f"Error creating asset: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating asset: {str(e)}")

@router.get("/enums")
async def get_asset_enums(current_user: User = Depends(get_current_user)):
    """Get asset enum values with Japanese labels"""
    try:
        return {
            "asset_classes": [
                {"value": "CashEq", "label": "現金等価物"},
                {"value": "FixedIncome", "label": "債券"},
                {"value": "Equity", "label": "株式"},
                {"value": "RealAsset", "label": "実物資産"},
                {"value": "Crypto", "label": "暗号資産"}
            ],
            "asset_types": [
                {"value": "Savings", "label": "普通預金"},
                {"value": "MMF", "label": "マネーマーケットファンド"},
                {"value": "Stablecoin", "label": "ステーブルコイン"},
                {"value": "GovBond", "label": "国債"},
                {"value": "CorpBond", "label": "社債"},
                {"value": "BondETF", "label": "債券ETF"},
                {"value": "DirectStock", "label": "個別株"},
                {"value": "EquityETF", "label": "株式ETF"},
                {"value": "MutualFund", "label": "投資信託"},
                {"value": "REIT", "label": "REIT"},
                {"value": "Commodity", "label": "コモディティ"},
                {"value": "GoldETF", "label": "金ETF"},
                {"value": "Crypto", "label": "暗号資産"}
            ],
            "regions": [
                {"value": "US", "label": "アメリカ"},
                {"value": "JP", "label": "日本"},
                {"value": "EU", "label": "ヨーロッパ"},
                {"value": "EM", "label": "新興国"},
                {"value": "DM", "label": "先進国"},
                {"value": "GL", "label": "グローバル"}
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get enums: {str(e)}")

@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(
    asset_id: str,  # UUID string
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        asset_uuid = uuid.UUID(asset_id)  # 🔧 修正: uuid.UUID を正しく使用
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid asset ID format")
    
    result = await db.execute(select(Asset).where(Asset.id == asset_uuid))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    return AssetResponse(
        id=str(asset.id),
        symbol=asset.symbol,
        name=asset.name,
        asset_class=asset.asset_class.value,
        asset_type=asset.asset_type.value if asset.asset_type else None,
        region=asset.region.value if asset.region else None,
        sub_category=asset.sub_category,  # サブカテゴリ追加
        currency=asset.currency,
        exchange=asset.exchange,
        isin=asset.isin,
    )

@router.delete("/{asset_id}")
async def delete_asset(
    asset_id: str,  # 🔧 修正: str型に変更
    current_user: User = Depends(get_current_user),  # 🔧 追加: 認証チェック
    db: AsyncSession = Depends(get_db)  # 🔧 修正: session -> db
):
    try:
        asset_uuid = uuid.UUID(asset_id)  # 🔧 修正: UUID変換
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid asset ID format")
    
    result = await db.execute(
        select(Asset)
        .options(selectinload(Asset.holdings))
        .where(Asset.id == asset_uuid)
    )
    asset = result.scalar_one_or_none()
    if asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")

    # 任意: Holdings がある場合は削除を拒否
    if asset.holdings:
        raise HTTPException(status_code=400, detail="Cannot delete asset with holdings")

    await db.delete(asset)
    await db.commit()
    return {"message": "Asset deleted"}