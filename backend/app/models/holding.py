from sqlalchemy import Column, Integer, Float, Date, ForeignKey, Enum, DateTime, String
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.database import Base

class AccountType(str, enum.Enum):
    NISA = "NISA"
    IDECO = "iDeCo"
    TAXABLE = "taxable"

class Holding(Base):
    __tablename__ = "holdings"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
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