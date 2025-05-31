from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from datetime import date
import uuid

from app.database import get_db
from app.models import Holding, Asset, Owner, User
from app.api.auth import get_current_user
from pydantic import BaseModel
from app.models.holding import AccountType

router = APIRouter()

# Pydantic models - データベーススキーマと完全一致
class HoldingCreate(BaseModel):
    asset_id: str  # UUID string
    owner_id: str  # UUID string - 正しい名義人管理
    quantity: float
    cost_total: float
    acquisition_date: date
    account_type: AccountType
    broker: str | None = None
    notes: str | None = None

class HoldingUpdate(BaseModel):
    asset_id: str | None = None
    owner_id: str | None = None
    quantity: float | None = None
    cost_total: float | None = None
    acquisition_date: date | None = None
    account_type: AccountType | None = None
    broker: str | None = None
    notes: str | None = None

# 既存のコード内で、HoldingResponseが正しく cost_per_unit を含んでいることを確認
class HoldingResponse(BaseModel):
    id: str  # UUID string
    asset: dict
    owner: dict  # 名義人情報
    quantity: float
    cost_total: float
    acquisition_date: date
    account_type: str
    broker: str | None
    notes: str | None
    cost_per_unit: float  # 🔧 確認: このフィールドが含まれている
    
    class Config:
        from_attributes = True

# Routes
@router.get("/", response_model=List[HoldingResponse])
async def get_holdings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all holdings with proper relationships"""
    result = await db.execute(
        select(Holding).options(
            selectinload(Holding.asset),
            selectinload(Holding.owner)  # 名義人情報を含める
        )
    )
    holdings = result.scalars().all()
    
    return [
        HoldingResponse(
            id=str(h.id),
            asset={
                "id": str(h.asset.id),
                "symbol": h.asset.symbol,
                "name": h.asset.name,
                "asset_class": h.asset.asset_class.value,
                "asset_type": h.asset.asset_type.value if h.asset.asset_type else None,
                "region": h.asset.region.value if h.asset.region else None,
                "sub_category": h.asset.sub_category,
                "currency": h.asset.currency,
            },
            owner={  # 正しい名義人情報
                "id": str(h.owner.id),
                "name": h.owner.name,
                "owner_type": h.owner.owner_type.value
            },
            quantity=h.quantity,
            cost_total=h.cost_total,
            acquisition_date=h.acquisition_date,
            account_type=h.account_type.value,
            broker=h.broker,
            notes=h.notes,
            cost_per_unit=h.cost_per_unit
        )
        for h in holdings
    ]

@router.post("/", response_model=HoldingResponse)
async def create_holding(
    holding_data: HoldingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new holding"""
    # Verify asset exists
    try:
        asset_uuid = uuid.UUID(holding_data.asset_id)
        owner_uuid = uuid.UUID(holding_data.owner_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")
    
    # Check asset exists
    result = await db.execute(
        select(Asset).where(Asset.id == asset_uuid)
    )
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Check owner exists
    result = await db.execute(
        select(Owner).where(Owner.id == owner_uuid)
    )
    owner = result.scalar_one_or_none()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")
    
    # Create holding
    holding = Holding(
        asset_id=asset_uuid,
        owner_id=owner_uuid,
        quantity=holding_data.quantity,
        cost_total=holding_data.cost_total,
        acquisition_date=holding_data.acquisition_date,
        account_type=holding_data.account_type,
        broker=holding_data.broker,
        notes=holding_data.notes
    )
    db.add(holding)
    await db.commit()
    await db.refresh(holding)
    
    # Load relationships
    await db.refresh(holding, attribute_names=['asset', 'owner'])
    
    return HoldingResponse(
        id=str(holding.id),
        asset={
            "id": str(holding.asset.id),
            "symbol": holding.asset.symbol,
            "name": holding.asset.name,
            "asset_class": holding.asset.asset_class.value,
            "asset_type": holding.asset.asset_type.value if holding.asset.asset_type else None,
            "region": holding.asset.region.value if holding.asset.region else None,
            "sub_category": holding.asset.sub_category,
            "currency": holding.asset.currency,
        },
        owner={
            "id": str(holding.owner.id),
            "name": holding.owner.name,
            "owner_type": holding.owner.owner_type.value
        },
        quantity=holding.quantity,
        cost_total=holding.cost_total,
        acquisition_date=holding.acquisition_date,
        account_type=holding.account_type.value,
        broker=holding.broker,
        notes=holding.notes,
        cost_per_unit=holding.cost_per_unit
    )

@router.put("/{holding_id}", response_model=HoldingResponse)
async def update_holding(
    holding_id: str,
    holding_data: HoldingUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a holding"""
    try:
        holding_uuid = uuid.UUID(holding_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid holding ID format")
    
    result = await db.execute(
        select(Holding).where(Holding.id == holding_uuid).options(
            selectinload(Holding.asset),
            selectinload(Holding.owner)
        )
    )
    holding = result.scalar_one_or_none()
    
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")
    
    # Update fields
    update_data = holding_data.dict(exclude_unset=True)
    
    # Convert UUID strings to UUID objects if needed
    if 'asset_id' in update_data:
        try:
            update_data['asset_id'] = uuid.UUID(update_data['asset_id'])
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid asset ID format")
            
    if 'owner_id' in update_data:
        try:
            update_data['owner_id'] = uuid.UUID(update_data['owner_id'])
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid owner ID format")
    
    for field, value in update_data.items():
        setattr(holding, field, value)
    
    await db.commit()
    await db.refresh(holding)
    
    return HoldingResponse(
        id=str(holding.id),
        asset={
            "id": str(holding.asset.id),
            "symbol": holding.asset.symbol,
            "name": holding.asset.name,
            "asset_class": holding.asset.asset_class.value,
            "asset_type": holding.asset.asset_type.value if holding.asset.asset_type else None,
            "region": holding.asset.region.value if holding.asset.region else None,
            "sub_category": holding.asset.sub_category,
            "currency": holding.asset.currency,
        },
        owner={
            "id": str(holding.owner.id),
            "name": holding.owner.name,
            "owner_type": holding.owner.owner_type.value
        },
        quantity=holding.quantity,
        cost_total=holding.cost_total,
        acquisition_date=holding.acquisition_date,
        account_type=holding.account_type.value,
        broker=holding.broker,
        notes=holding.notes,
        cost_per_unit=holding.cost_per_unit
    )

@router.delete("/{holding_id}")
async def delete_holding(
    holding_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a holding"""
    try:
        holding_uuid = uuid.UUID(holding_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid holding ID format")
    
    result = await db.execute(
        select(Holding).where(Holding.id == holding_uuid)
    )
    holding = result.scalar_one_or_none()
    
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")
    
    await db.delete(holding)
    await db.commit()
    
    return {"message": "Holding deleted successfully"}

@router.get("/account-types")
async def get_account_types(current_user: User = Depends(get_current_user)):
    """Get available account types"""
    return {
        "account_types": [
            {"value": "NISA_growth", "label": "NISA成長投資枠"},
            {"value": "NISA_reserve", "label": "NISA積立投資枠"},
            {"value": "iDeCo", "label": "iDeCo"},
            {"value": "DC", "label": "確定拠出年金"},
            {"value": "specific", "label": "特定口座"},
            {"value": "general", "label": "一般口座"}
        ]
    }