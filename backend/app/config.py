from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    
    # Redis
    REDIS_URL: str
    
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
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"

settings = Settings()
# デバッグ用のprint文を削除！