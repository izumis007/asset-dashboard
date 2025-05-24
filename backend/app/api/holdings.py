from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from datetime import date

from app.database import get_db
from app.models import Holding, Asset, User
from app.api.auth import get_current_user
from pydantic import BaseModel
from app.models.holding import AccountType

router = APIRouter()

# Pydantic models
class HoldingCreate(BaseModel):
    asset_id: int
    quantity: float
    cost_total: float
    acquisition_date: date
    account_type: AccountType
    broker: str | None = None
    notes: str | None = None

class HoldingUpdate(BaseModel):
    quantity: float | None = None
    cost_total: float | None = None
    acquisition_date: date | None = None
    account_type: AccountType | None = None
    broker: str | None = None
    notes: str | None = None

class HoldingResponse(BaseModel):
    id: int
    asset: dict
    quantity: float
    cost_total: float
    acquisition_date: date
    account_type: str
    broker: str | None
    notes: str | None
    cost_per_unit: float
    
    class Config:
        from_attributes = True

# Routes
@router.get("/", response_model=List[HoldingResponse])
async def get_holdings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all holdings"""
    result = await db.execute(
        select(Holding).options(selectinload(Holding.asset))
    )
    holdings = result.scalars().all()
    
    return [
        HoldingResponse(
            id=h.id,
            asset={
                "id": h.asset.id,
                "symbol": h.asset.symbol,
                "name": h.asset.name,
                "category": h.asset.category.value,
                "currency": h.asset.currency
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
    result = await db.execute(
        select(Asset).where(Asset.id == holding_data.asset_id)
    )
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Create holding
    holding = Holding(**holding_data.dict())
    db.add(holding)
    await db.commit()
    await db.refresh(holding)
    
    # Load relationship
    await db.refresh(holding, attribute_names=['asset'])
    
    return HoldingResponse(
        id=holding.id,
        asset={
            "id": holding.asset.id,
            "symbol": holding.asset.symbol,
            "name": holding.asset.name,
            "category": holding.asset.category.value,
            "currency": holding.asset.currency
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
    holding_id: int,
    holding_data: HoldingUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a holding"""
    result = await db.execute(
        select(Holding).where(Holding.id == holding_id).options(selectinload(Holding.asset))
    )
    holding = result.scalar_one_or_none()
    
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")
    
    # Update fields
    for field, value in holding_data.dict(exclude_unset=True).items():
        setattr(holding, field, value)
    
    await db.commit()
    await db.refresh(holding)
    
    return HoldingResponse(
        id=holding.id,
        asset={
            "id": holding.asset.id,
            "symbol": holding.asset.symbol,
            "name": holding.asset.name,
            "category": holding.asset.category.value,
            "currency": holding.asset.currency
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
    holding_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a holding"""
    result = await db.execute(
        select(Holding).where(Holding.id == holding_id)
    )
    holding = result.scalar_one_or_none()
    
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")
    
    await db.delete(holding)
    await db.commit()
    
    return {"message": "Holding deleted successfully"}