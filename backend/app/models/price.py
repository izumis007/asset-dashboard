from sqlalchemy import Column, Float, Date, ForeignKey, UniqueConstraint, DateTime, String
from sqlalchemy.dialects.postgresql import UUID  # 🔧 追加: UUID import
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid  # 🔧 追加: uuid import
from app.database import Base

class Price(Base):
    __tablename__ = "prices"
    
    # 🔧 修正: UUID主キーに変更（他のテーブルと統一）
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id"), nullable=False)  # 🔧 修正: UUID外部キー
    date = Column(Date, nullable=False, index=True)
    price = Column(Float, nullable=False)  # Price in asset's currency
    
    # Optional fields for more detailed data
    open = Column(Float, nullable=True)
    high = Column(Float, nullable=True)
    low = Column(Float, nullable=True)
    volume = Column(Float, nullable=True)
    
    # Data source tracking
    source = Column(String(50), nullable=True)  # e.g., "twelve_data", "stooq", "alpha_vantage"
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    asset = relationship("Asset", back_populates="prices")
    
    # Unique constraint on asset_id + date
    __table_args__ = (
        UniqueConstraint('asset_id', 'date', name='_asset_date_uc'),
    )