from sqlalchemy import Column, String, Float, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.database import Base

class CashBalance(Base):
    __tablename__ = "cash_balances"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    institution = Column(String(100), nullable=False)  # e.g., "Rakuten Bank"
    account_name = Column(String(100), nullable=True)  # Optional account nickname
    currency = Column(String(3), nullable=False, default="JPY")
    amount = Column(Float, nullable=False)
    
    # Timestamps
    timestamp = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Source tracking
    source = Column(String(50), nullable=True, default="money_forward")  # e.g., "money_forward", "manual"