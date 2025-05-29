from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    
    # PostgreSQL (Docker Compose用)
    POSTGRES_DB: str = "asset_dashboard"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str
    
    # Redis
    REDIS_URL: str
    REDIS_PASSWORD: str = ""
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",    # ホスト開発用（npm run dev）
        "http://frontend:3000",     # Docker内のNext.js
        "http://127.0.0.1:3000",    # localhostの別表現（念のため）
    ]
    
    # API Keys
    TWELVE_DATA_API_KEY: str = ""
    ALPHA_VANTAGE_API_KEY: str = ""
    COINGECKO_API_KEY: str = ""
    
    # Money Forward
    MONEY_FORWARD_EMAIL: str = ""
    MONEY_FORWARD_PASSWORD: str = ""
    
    # Email (optional)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""
    
    # Slack (optional)
    SLACK_WEBHOOK_URL: str = ""
    
    # Application
    TIMEZONE: str = "Asia/Tokyo"
    BASE_CURRENCY: str = "JPY"
    
    # Price fetch settings
    PRICE_FETCH_HOUR: int = 0  # 00:30 JST
    PRICE_FETCH_MINUTE: int = 30
    
    # Docker/Deployment
    DOMAIN: str = "localhost"
    NEXT_PUBLIC_API_URL: str = "http://localhost:8000"
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "allow"  # 追加の環境変数を許可
    }

settings = Settings()
print("DATABASE_URL:", os.getenv("DATABASE_URL"))