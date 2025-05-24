from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.sql import func
from fastapi_users.db import SQLAlchemyBaseUserTableUUID
from app.database import Base

class User(SQLAlchemyBaseUserTableUUID, Base):
    __tablename__ = "users"
    
    # Additional fields beyond fastapi-users defaults
    username = Column(String(50), unique=True, nullable=False)
    totp_secret = Column(String(32), nullable=True)
    totp_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())