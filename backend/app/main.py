from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database import engine, Base

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("Starting up Asset Dashboard API...")
    
    # Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
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

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://frontend:3000",
        "http://localhost",
        "http://127.0.0.1:3000",
        "*"  # 開発時のみ
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Try to import and include routers with error handling
try:
    from app.api import auth
    app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
    logger.info("✅ Auth router loaded successfully")
except Exception as e:
    logger.error(f"❌ Failed to load auth router: {e}")

try:
    from app.api import assets
    app.include_router(assets.router, prefix="/api/assets", tags=["assets"])
    logger.info("✅ Assets router loaded successfully")
except Exception as e:
    logger.error(f"❌ Failed to load assets router: {e}")

try:
    from app.api import holdings
    app.include_router(holdings.router, prefix="/api/holdings", tags=["holdings"])
    logger.info("✅ Holdings router loaded successfully")
except Exception as e:
    logger.error(f"❌ Failed to load holdings router: {e}")

try:
    from app.api import prices
    app.include_router(prices.router, prefix="/api/prices", tags=["prices"])
    logger.info("✅ Prices router loaded successfully")
except Exception as e:
    logger.error(f"❌ Failed to load prices router: {e}")

try:
    from app.api import btc_trades
    app.include_router(btc_trades.router, prefix="/api/btc-trades", tags=["btc-trades"])
    logger.info("✅ BTC trades router loaded successfully")
except Exception as e:
    logger.error(f"❌ Failed to load btc_trades router: {e}")

try:
    from app.api import dashboard
    app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
    logger.info("✅ Dashboard router loaded successfully")
except Exception as e:
    logger.error(f"❌ Failed to load dashboard router: {e}")

@app.get("/")
async def root():
    return {
        "message": "Asset Dashboard API",
        "version": "0.2.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "asset-dashboard-api"
    }

# Debug endpoint to list all routes
@app.get("/debug/routes")
async def debug_routes():
    routes = []
    for route in app.routes:
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            routes.append({
                "path": route.path,
                "methods": list(route.methods)
            })
    return routes