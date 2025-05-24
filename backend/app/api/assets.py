from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.models import Asset, User
from app.api.auth import get_current_user
from pydantic import BaseModel
from app.models.asset import AssetCategory

router = APIRouter()

# Pydantic models
class AssetCreate(BaseModel):
    symbol: str
    name: str
    category: AssetCategory
    currency: str = "JPY"
    exchange: str | None = None
    isin: str | None = None

class AssetUpdate(BaseModel):
    name: str | None = None
    exchange: str | None = None
    isin: str | None = None

class AssetResponse(BaseModel):
    id: int
    symbol: str
    name: str
    category: str
    currency: str
    exchange: str | None
    isin: str | None
    
    class Config:
        from_attributes = True

# Routes
@router.get("/", response_model=List[AssetResponse])
async def get_assets(
    category: AssetCategory | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all assets, optionally filtered by category"""
    query = select(Asset)
    if category:
        query = query.where(Asset.category == category)
    
    result = await db.execute(query.order_by(Asset.name))
    assets = result.scalars().all()
    
    return [
        AssetResponse(
            id=asset.id,
            symbol=asset.symbol,
            name=asset.name,
            category=asset.category.value,
            currency=asset.currency,
            exchange=asset.exchange,
            isin=asset.isin
        )
        for asset in assets
    ]

@router.post("/", response_model=AssetResponse)
async def create_asset(
    asset_data: AssetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new asset"""
    # Check if asset already exists
    result = await db.execute(
        select(Asset).where(
            Asset.symbol == asset_data.symbol,
            Asset.category == asset_data.category
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail=f"Asset {asset_data.symbol} already exists in category {asset_data.category}"
        )
    
    asset = Asset(**asset_data.dict())
    db.add(asset)
    await db.commit()
    await db.refresh(asset)
    
    return AssetResponse(
        id=asset.id,
        symbol=asset.symbol,
        name=asset.name,
        category=asset.category.value,
        currency=asset.currency,
        exchange=asset.exchange,
        isin=asset.isin
    )

@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(
    asset_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific asset"""
    result = await db.execute(
        select(Asset).where(Asset.id == asset_id)
    )
    asset = result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    return AssetResponse(
        id=asset.id,
        symbol=asset.symbol,
        name=asset.name,
        category=asset.category.value,
        currency=asset.currency,
        exchange=asset.exchange,
        isin=asset.isin
    )

@router.put("/{asset_id}", response_model=AssetResponse)
async def update_asset(
    asset_id: int,
    asset_data: AssetUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update an asset"""
    result = await db.execute(
        select(Asset).where(Asset.id == asset_id)
    )
    asset = result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Update fields
    for field, value in asset_data.dict(exclude_unset=True).items():
        setattr(asset, field, value)
    
    await db.commit()
    await db.refresh(asset)
    
    return AssetResponse(
        id=asset.id,
        symbol=asset.symbol,
        name=asset.name,
        category=asset.category.value,
        currency=asset.currency,
        exchange=asset.exchange,
        isin=asset.isin
    )

@router.delete("/{asset_id}")
async def delete_asset(
    asset_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete an asset"""
    result = await db.execute(
        select(Asset).where(Asset.id == asset_id)
    )
    asset = result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Check if asset has holdings
    if asset.holdings:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete asset with existing holdings"
        )
    
    await db.delete(asset)
    await db.commit()
    
    return {"message": "Asset deleted successfully"}

@router.get("/search/{query}")
async def search_assets(
    query: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Search assets by symbol or name"""
    result = await db.execute(
        select(Asset).where(
            Asset.symbol.ilike(f"%{query}%") | 
            Asset.name.ilike(f"%{query}%")
        ).limit(10)
    )
    assets = result.scalars().all()
    
    return [
        {
            "id": asset.id,
            "symbol": asset.symbol,
            "name": asset.name,
            "category": asset.category.value,
            "currency": asset.currency
        }
        for asset in assets
    ]