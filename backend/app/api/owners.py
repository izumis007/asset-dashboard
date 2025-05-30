from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid

from app.database import get_db
from app.models import Owner, User
from app.models.owner import OwnerType
from app.api.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

# Pydantic models
class OwnerCreate(BaseModel):
    name: str
    owner_type: OwnerType

class OwnerUpdate(BaseModel):
    name: str | None = None
    owner_type: OwnerType | None = None

class OwnerResponse(BaseModel):
    id: uuid.UUID
    name: str
    owner_type: str
    created_at: str
    updated_at: str
    
    class Config:
        from_attributes = True

# Routes
@router.get("/", response_model=List[OwnerResponse])
async def get_owners(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all owners"""
    result = await db.execute(
        select(Owner).order_by(Owner.name)
    )
    owners = result.scalars().all()
    
    return [
        OwnerResponse(
            id=owner.id,
            name=owner.name,
            owner_type=owner.owner_type.value,
            created_at=owner.created_at.isoformat(),
            updated_at=owner.updated_at.isoformat()
        )
        for owner in owners
    ]

@router.post("/", response_model=OwnerResponse)
async def create_owner(
    owner_data: OwnerCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new owner"""
    # Check for duplicate name (optional - can be removed if you want to allow duplicates)
    result = await db.execute(
        select(Owner).where(Owner.name == owner_data.name)
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Owner with this name already exists")
    
    # Create owner
    owner = Owner(**owner_data.dict())
    db.add(owner)
    await db.commit()
    await db.refresh(owner)
    
    return OwnerResponse(
        id=owner.id,
        name=owner.name,
        owner_type=owner.owner_type.value,
        created_at=owner.created_at.isoformat(),
        updated_at=owner.updated_at.isoformat()
    )

@router.get("/{owner_id}", response_model=OwnerResponse)
async def get_owner(
    owner_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific owner"""
    result = await db.execute(select(Owner).where(Owner.id == owner_id))
    owner = result.scalar_one_or_none()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")
    
    return OwnerResponse(
        id=owner.id,
        name=owner.name,
        owner_type=owner.owner_type.value,
        created_at=owner.created_at.isoformat(),
        updated_at=owner.updated_at.isoformat()
    )

@router.put("/{owner_id}", response_model=OwnerResponse)
async def update_owner(
    owner_id: uuid.UUID,
    owner_data: OwnerUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update an owner"""
    result = await db.execute(select(Owner).where(Owner.id == owner_id))
    owner = result.scalar_one_or_none()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")
    
    # Check for duplicate name if name is being updated
    if owner_data.name and owner_data.name != owner.name:
        result = await db.execute(
            select(Owner).where(Owner.name == owner_data.name)
        )
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Owner with this name already exists")
    
    # Update fields
    for field, value in owner_data.dict(exclude_unset=True).items():
        setattr(owner, field, value)
    
    await db.commit()
    await db.refresh(owner)
    
    return OwnerResponse(
        id=owner.id,
        name=owner.name,
        owner_type=owner.owner_type.value,
        created_at=owner.created_at.isoformat(),
        updated_at=owner.updated_at.isoformat()
    )

@router.delete("/{owner_id}")
async def delete_owner(
    owner_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete an owner"""
    result = await db.execute(select(Owner).where(Owner.id == owner_id))
    owner = result.scalar_one_or_none()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")
    
    # Check if owner has any holdings
    if owner.holdings:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete owner with holdings. Please reassign or delete holdings first."
        )
    
    await db.delete(owner)
    await db.commit()
    
    return {"message": "Owner deleted successfully"}

@router.get("/enums/owner-types")
async def get_owner_types(current_user: User = Depends(get_current_user)):
    """Get available owner types"""
    return {
        "owner_types": [
            {"value": "self", "label": "自分"},
            {"value": "spouse", "label": "配偶者"},
            {"value": "joint", "label": "共有"},
            {"value": "child", "label": "子ども"},
            {"value": "other", "label": "その他"}
        ]
    }