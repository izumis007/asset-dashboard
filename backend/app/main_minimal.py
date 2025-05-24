from fastapi import FastAPI
from datetime import datetime

app = FastAPI(title="Asset Dashboard API - Minimal")

@app.get("/")
async def root():
    return {
        "message": "Asset Dashboard API is running",
        "timestamp": datetime.now().isoformat(),
        "version": "0.1.0"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "asset-dashboard-api"
    }

@app.get("/api/test")
async def test_endpoint():
    return {
        "test": "OK",
        "description": "This is a test endpoint"
    }
