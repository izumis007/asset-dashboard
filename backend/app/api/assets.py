from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import logging
import traceback

from app.database import get_db
from app.models import Asset, User
from app.api.auth import get_current_user
from pydantic import BaseModel
from app.models.asset import AssetClass, AssetType, Region

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic models - categoryを完全に削除
class AssetCreate(BaseModel):
    symbol: str
    name: str
    asset_class: AssetClass  # 必須（categoryは完全削除）
    asset_type: Optional[AssetType] = None
    region: Optional[Region] = None
    currency: str = "JPY"
    exchange: Optional[str] = None
    isin: Optional[str] = None
    sub_category: Optional[str] = None

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    asset_class: Optional[AssetClass] = None
    asset_type: Optional[AssetType] = None
    region: Optional[Region] = None
    exchange: Optional[str] = None
    isin: Optional[str] = None
    currency: Optional[str] = None
    sub_category: Optional[str] = None

class AssetResponse(BaseModel):
    id: int
    symbol: str
    name: str
    asset_class: str  # 必須
    asset_type: Optional[str] = None
    region: Optional[str] = None
    currency: str
    exchange: Optional[str] = None
    isin: Optional[str] = None
    sub_category: Optional[str] = None
    display_category: str

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
                    id=a.id,
                    symbol=a.symbol,
                    name=a.name,
                    asset_class=a.asset_class.value,
                    asset_type=a.asset_type.value if a.asset_type else None,
                    region=a.region.value if a.region else None,
                    sub_category=a.sub_category,
                    currency=a.currency,
                    exchange=a.exchange,
                    isin=a.isin,
                    display_category=a.display_category,
                )
                response_list.append(asset_response)
            except Exception as e:
                logger.error(f"Error processing asset {a.id}: {str(e)}")
                logger.error(f"Asset data: id={a.id}, symbol={a.symbol}, asset_class={a.asset_class}")
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
        # 重複チェック
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
            id=asset.id,
            symbol=asset.symbol,
            name=asset.name,
            asset_class=asset.asset_class.value,
            asset_type=asset.asset_type.value if asset.asset_type else None,
            region=asset.region.value if asset.region else None,
            sub_category=asset.sub_category,
            currency=asset.currency,
            exchange=asset.exchange,
            isin=asset.isin,
            display_category=asset.display_category,
        )
    except Exception as e:
        logger.error(f"Error creating asset: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error creating asset: {str(e)}")

# backend/app/api/assets.py

@router.get("/enums")
async def get_asset_enums(current_user: User = Depends(get_current_user)):
    """Get asset enum values with Japanese labels"""
    try:
        return {
            "asset_classes": [
                {"value": "CASHEQ", "label": "現金等価物"},
                {"value": "FIXED_INCOME", "label": "債券"},
                {"value": "EQUITY", "label": "株式"},
                {"value": "REAL_ASSET", "label": "実物資産"},
                {"value": "CRYPTO", "label": "暗号資産"}
            ],
            "asset_types": [
                {"value": "SAVINGS", "label": "普通預金"},
                {"value": "MMF", "label": "マネーマーケットファンド"},
                {"value": "STABLECOIN", "label": "ステーブルコイン"},
                {"value": "GOV_BOND", "label": "国債"},
                {"value": "CORP_BOND", "label": "社債"},
                {"value": "BOND_ETF", "label": "債券ETF"},
                {"value": "DIRECT_STOCK", "label": "個別株"},
                {"value": "EQUITY_ETF", "label": "株式ETF"},
                {"value": "MUTUAL_FUND", "label": "投資信託"},
                {"value": "REIT", "label": "REIT"},
                {"value": "COMMODITY", "label": "コモディティ"},
                {"value": "GOLD_ETF", "label": "金ETF"},
                {"value": "CRYPTO", "label": "暗号資産"}
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
    asset_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    return AssetResponse(
        id=asset.id,
        symbol=asset.symbol,
        name=asset.name,
        asset_class=asset.asset_class.value,
        asset_type=asset.asset_type.value if asset.asset_type else None,
        region=asset.region.value if asset.region else None,
        sub_category=asset.sub_category,
        currency=asset.currency,
        exchange=asset.exchange,
        isin=asset.isin,
        display_category=asset.display_category,
    )

@router.delete("/{asset_id}")
async def delete_asset(
    asset_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    # holdingsリレーションシップをチェック
    if hasattr(asset, 'holdings') and asset.holdings:
        raise HTTPException(status_code=400, detail="Cannot delete asset with holdings")

    await db.delete(asset)
    await db.commit()
    return {"message": "Asset deleted successfully"}