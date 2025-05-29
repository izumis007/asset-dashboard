from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.database import get_db
from app.models import Asset, User
from app.api.auth import get_current_user
from pydantic import BaseModel
from app.models.asset import AssetClass, AssetType, Region, AssetCategory

router = APIRouter()

# Pydantic models
class AssetCreate(BaseModel):
    symbol: str
    name: str
    asset_class: Optional[AssetClass] = None
    asset_type: Optional[AssetType] = None
    region: Optional[Region] = None
    category: Optional[AssetCategory] = None
    currency: str = "JPY"
    exchange: Optional[str] = None
    isin: Optional[str] = None
    sub_category: Optional[str] = None

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    asset_class: Optional[AssetClass] = None
    asset_type: Optional[AssetType] = None
    region: Optional[Region] = None
    category: Optional[AssetCategory] = None
    exchange: Optional[str] = None
    isin: Optional[str] = None
    currency: Optional[str] = None
    sub_category: Optional[str] = None

class AssetResponse(BaseModel):
    id: int
    symbol: str
    name: str
    asset_class: Optional[str] = None
    asset_type: Optional[str] = None
    region: Optional[str] = None
    category: Optional[str] = None
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
    category: Optional[AssetCategory] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Asset)
    if asset_class:
        query = query.where(Asset.asset_class == asset_class)
    if asset_type:
        query = query.where(Asset.asset_type == asset_type)
    if region:
        query = query.where(Asset.region == region)
    if category:
        query = query.where(Asset.category == category)

    result = await db.execute(query.order_by(Asset.name))
    assets = result.scalars().all()

    return [
        AssetResponse(
            id=a.id,
            symbol=a.symbol,
            name=a.name,
            asset_class=a.asset_class.value if a.asset_class else None,
            asset_type=a.asset_type.value if a.asset_type else None,
            region=a.region.value if a.region else None,
            category=a.category.value if a.category else None,
            currency=a.currency,
            exchange=a.exchange,
            isin=a.isin,
            sub_category=a.sub_category,
            display_category=a.display_category,
        ) for a in assets
    ]

@router.post("/", response_model=AssetResponse)
async def create_asset(
    asset_data: AssetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
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
        asset_class=asset.asset_class.value if asset.asset_class else None,
        asset_type=asset.asset_type.value if asset.asset_type else None,
        region=asset.region.value if asset.region else None,
        category=asset.category.value if asset.category else None,
        currency=asset.currency,
        exchange=asset.exchange,
        isin=asset.isin,
        sub_category=asset.sub_category,
        display_category=asset.display_category,
    )

@router.get("/enums")
async def get_asset_enums(current_user: User = Depends(get_current_user)):
    return {
        "asset_classes": [{"value": e.value, "label": e.value} for e in AssetClass],
        "asset_types": [{"value": e.value, "label": e.value} for e in AssetType],
        "regions": [{"value": e.value, "label": e.value} for e in Region],
        "categories": [{"value": e.value, "label": e.value} for e in AssetCategory],
    }

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
        asset_class=asset.asset_class.value if asset.asset_class else None,
        asset_type=asset.asset_type.value if asset.asset_type else None,
        region=asset.region.value if asset.region else None,
        category=asset.category.value if asset.category else None,
        currency=asset.currency,
        exchange=asset.exchange,
        isin=asset.isin,
        sub_category=asset.sub_category,
        display_category=asset.display_category,
    )

@router.put("/{asset_id}", response_model=AssetResponse)
async def update_asset(
    asset_id: int,
    asset_data: AssetUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    for field, value in asset_data.dict(exclude_unset=True).items():
        setattr(asset, field, value)

    await db.commit()
    await db.refresh(asset)

    return AssetResponse(
        id=asset.id,
        symbol=asset.symbol,
        name=asset.name,
        asset_class=asset.asset_class.value if asset.asset_class else None,
        asset_type=asset.asset_type.value if asset.asset_type else None,
        region=asset.region.value if asset.region else None,
        category=asset.category.value if asset.category else None,
        currency=asset.currency,
        exchange=asset.exchange,
        isin=asset.isin,
        sub_category=asset.sub_category,
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

    if asset.holdings:
        raise HTTPException(status_code=400, detail="Cannot delete asset with holdings")

    await db.delete(asset)
    await db.commit()
    return {"message": "Asset deleted successfully"}

@router.get("/search/{query}")
async def search_assets(
    query: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Asset).where(
            Asset.symbol.ilike(f"%{query}%") |
            Asset.name.ilike(f"%{query}%")
        ).limit(10)
    )
    assets = result.scalars().all()
    return [
        {
            "id": a.id,
            "symbol": a.symbol,
            "name": a.name,
            "asset_class": a.asset_class.value if a.asset_class else None,
            "asset_type": a.asset_type.value if a.asset_type else None,
            "region": a.region.value if a.region else None,
            "category": a.category.value if a.category else None,
            "currency": a.currency,
            "sub_category": a.sub_category,
            "display_category": a.display_category
        } for a in assets
    ]