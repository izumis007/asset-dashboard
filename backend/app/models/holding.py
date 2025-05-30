from sqlalchemy import Column, Float, Date, ForeignKey, Enum, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
import uuid  # 追加
from app.database import Base

class OwnerType(str, enum.Enum):
    self_ = "self"
    spouse = "spouse"
    child = "child"
    special = "special"

class AccountType(str, enum.Enum):
    NISA_GROWTH = "NISA_growth"    # NISA成長投資枠
    NISA_RESERVE = "NISA_reserve"  # NISA積立投資枠
    IDECO = "iDeCo"
    DC = "DC"                      # 確定拠出年金（企業型など）
    SPECIFIC = "specific"          # 特定口座（源泉徴収あり/なし）
    GENERAL = "general"            # 一般口座

class Holding(Base):
    __tablename__ = "holdings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    cost_total = Column(Float, nullable=False)  # Total cost in asset's currency
    acquisition_date = Column(Date, nullable=False)
    account_type = Column(Enum(AccountType), nullable=False)
    
    # Optional fields
    broker = Column(String(100), nullable=True)
    notes = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    asset = relationship("Asset", back_populates="holdings")
    
    @property
    def cost_per_unit(self):
        return self.cost_total / self.quantity if self.quantity > 0 else 0