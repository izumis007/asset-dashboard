from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database import engine, Base
from app.api import auth, assets, owners, holdings, prices, btc_trades, dashboard
from app.tasks.scheduled_tasks import setup_periodic_tasks

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("Starting up Asset Dashboard API...")
        
    # Setup periodic tasks
    setup_periodic_tasks()
    
    yield
    
    # Shutdown
    logger.info("Shutting down Asset Dashboard API...")

# Create FastAPI app
app = FastAPI(
    title="Asset Dashboard API",
    description="Self-hosted asset management dashboard API",
    version="0.2.0",
    lifespan=lifespan
)

# Configure CORS - 🔧 修正: より包括的な設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000", 
        "http://frontend:3000",
        "*"  # 開発環境では全許可（本番では削除）
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔧 修正: ルーター登録の順序と詳細ログ追加
logger.info("Registering API routes...")

# Include routers with explicit prefixes
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
logger.info("✓ Auth router registered: /api/auth")

app.include_router(assets.router, prefix="/api/assets", tags=["assets"])
logger.info("✓ Assets router registered: /api/assets")

app.include_router(owners.router, prefix="/api/owners", tags=["owners"])
logger.info("✓ Owners router registered: /api/owners")

app.include_router(holdings.router, prefix="/api/holdings", tags=["holdings"])
logger.info("✓ Holdings router registered: /api/holdings")

app.include_router(prices.router, prefix="/api/prices", tags=["prices"])
logger.info("✓ Prices router registered: /api/prices")

app.include_router(btc_trades.router, prefix="/api/btc-trades", tags=["btc-trades"])
logger.info("✓ BTC Trades router registered: /api/btc-trades")

app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
logger.info("✓ Dashboard router registered: /api/dashboard")

logger.info("All API routes registered successfully")

@app.get("/")
async def root():
    return {
        "message": "Asset Dashboard API",
        "version": "0.2.0",
        "docs": "/docs",
        "available_endpoints": [
            "/api/auth",
            "/api/assets", 
            "/api/owners",
            "/api/holdings",
            "/api/prices",
            "/api/btc-trades",
            "/api/dashboard"
        ]
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "asset-dashboard-api"
    }

# 🔧 追加: デバッグ用エンドポイント
@app.get("/debug/routes")
async def debug_routes():
    """List all registered routes for debugging"""
    routes = []
    for route in app.routes:
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            routes.append({
                "path": route.path,
                "methods": list(route.methods) if route.methods else [],
                "name": getattr(route, 'name', 'unknown')
            })
    return {"routes": routes}