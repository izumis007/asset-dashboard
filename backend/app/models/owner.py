from sqlalchemy import Column, String, Enum, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
import uuid
from app.database import Base

class OwnerType(str, enum.Enum):
    self = "self"      # データベーススキーマと完全一致
    spouse = "spouse"
    joint = "joint"
    child = "child"
    other = "other"

class Owner(Base):
    __tablename__ = "owners"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(100), nullable=False)  # 名義人名（必須）
    owner_type = Column(Enum(OwnerType), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    holdings = relationship("Holding", back_populates="owner", cascade="all, delete-orphan")