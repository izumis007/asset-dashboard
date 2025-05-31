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

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # フロントエンドのURL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(assets.router, prefix="/api/assets", tags=["assets"])
app.include_router(owners.router, prefix="/api/owners", tags=["owners"])  # 追加
app.include_router(holdings.router, prefix="/api/holdings", tags=["holdings"])
app.include_router(prices.router, prefix="/api/prices", tags=["prices"])
app.include_router(btc_trades.router, prefix="/api/btc-trades", tags=["btc-trades"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])

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