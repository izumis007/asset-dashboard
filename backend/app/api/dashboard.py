from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, date, timedelta
from typing import Dict, List
import logging

from app.database import get_db
from app.models import User, ValuationSnapshot
from app.api.auth import get_current_user
from app.services.valuation_calculator import ValuationCalculator
from app.tasks.scheduled_tasks import trigger_price_fetch
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()

# Response models
class DashboardOverview(BaseModel):
    total_jpy: float
    total_usd: float
    total_btc: float
    change_24h: float
    change_percentage: float
    breakdown_by_category: Dict[str, float]  # データベースカラム名に合わせる
    breakdown_by_currency: Dict[str, float]
    breakdown_by_account_type: Dict[str, float]
    history: List[Dict]

class RefreshResponse(BaseModel):
    message: str
    task_id: str | None = None

# Routes
@router.get("/overview", response_model=DashboardOverview)
async def get_dashboard_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get dashboard overview data"""
    
    # Get latest valuation snapshot
    result = await db.execute(
        select(ValuationSnapshot)
        .order_by(ValuationSnapshot.date.desc())
        .limit(1)
    )
    latest_snapshot = result.scalar_one_or_none()
    
    if not latest_snapshot:
        # 🔧 修正: snapshotが存在しない場合の処理を改善
        logger.info("No valuation snapshot found, attempting to calculate one")
        try:
            calculator = ValuationCalculator(db)
            latest_snapshot = await calculator.calculate_snapshot()
            if latest_snapshot:
                db.add(latest_snapshot)
                await db.commit()
                await db.refresh(latest_snapshot)
                logger.info("Created new valuation snapshot successfully")
            else:
                logger.warning("Failed to calculate valuation snapshot")
        except Exception as e:
            logger.error(f"Error calculating valuation snapshot: {e}")
            latest_snapshot = None
    
    # 🔧 修正: データがない場合のデフォルトレスポンスを明確に定義
    if not latest_snapshot:
        logger.info("Returning default dashboard data - no holdings or valuations available")
        return DashboardOverview(
            total_jpy=0.0,
            total_usd=0.0,
            total_btc=0.0,
            change_24h=0.0,
            change_percentage=0.0,
            breakdown_by_category={},
            breakdown_by_currency={},
            breakdown_by_account_type={},
            history=[]
        )
    
    # Get previous day snapshot for comparison
    yesterday = latest_snapshot.date - timedelta(days=1)
    result = await db.execute(
        select(ValuationSnapshot)
        .where(ValuationSnapshot.date == yesterday)
    )
    previous_snapshot = result.scalar_one_or_none()
    
    # Calculate changes
    change_24h = 0.0
    change_percentage = 0.0
    if previous_snapshot:
        change_24h = latest_snapshot.total_jpy - previous_snapshot.total_jpy
        if previous_snapshot.total_jpy > 0:
            change_percentage = (change_24h / previous_snapshot.total_jpy) * 100
    
    # Get historical data (last 365 days)
    one_year_ago = date.today() - timedelta(days=365)
    result = await db.execute(
        select(ValuationSnapshot)
        .where(ValuationSnapshot.date >= one_year_ago)
        .order_by(ValuationSnapshot.date)
    )
    history_snapshots = result.scalars().all()
    
    history = [
        {
            "date": snapshot.date.isoformat(),
            "total_jpy": snapshot.total_jpy,
            "total_usd": snapshot.total_usd
        }
        for snapshot in history_snapshots
    ]
    
    # 🔧 修正: Noneチェックを強化して安全なレスポンスを構築
    return DashboardOverview(
        total_jpy=latest_snapshot.total_jpy or 0.0,
        total_usd=latest_snapshot.total_usd or 0.0,
        total_btc=latest_snapshot.total_btc or 0.0,
        change_24h=change_24h,
        change_percentage=change_percentage,
        breakdown_by_category=latest_snapshot.breakdown_by_category or {},
        breakdown_by_currency=latest_snapshot.breakdown_by_currency or {},
        breakdown_by_account_type=latest_snapshot.breakdown_by_account_type or {},
        history=history
    )

@router.get("/history")
async def get_valuation_history(
    days: int = 365,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get valuation history for specified number of days"""
    
    start_date = date.today() - timedelta(days=days)
    
    result = await db.execute(
        select(ValuationSnapshot)
        .where(ValuationSnapshot.date >= start_date)
        .order_by(ValuationSnapshot.date)
    )
    snapshots = result.scalars().all()
    
    return [
        {
            "date": snapshot.date.isoformat(),
            "total_jpy": snapshot.total_jpy,
            "total_usd": snapshot.total_usd,
            "total_btc": snapshot.total_btc,
            "breakdown_by_category": snapshot.breakdown_by_category,  # データベースカラム名
            "breakdown_by_currency": snapshot.breakdown_by_currency,
            "breakdown_by_account_type": snapshot.breakdown_by_account_type
        }
        for snapshot in snapshots
    ]

@router.post("/refresh-prices", response_model=RefreshResponse)
async def refresh_prices(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """Manually trigger price refresh"""
    
    # 🔧 修正: Celeryタスクが利用できない場合のハンドリング
    try:
        # Trigger price fetch task
        task = trigger_price_fetch.delay()
        return RefreshResponse(
            message="Price refresh initiated",
            task_id=task.id if hasattr(task, 'id') else None
        )
    except Exception as e:
        # Celeryが動いていない場合のフォールバック
        logger.warning(f"Celery price refresh failed: {e}")
        return RefreshResponse(
            message="Price refresh not available - Celery worker not running",
            task_id=None
        )

@router.get("/summary")
async def get_portfolio_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed portfolio summary"""
    
    # Get latest snapshot
    result = await db.execute(
        select(ValuationSnapshot)
        .order_by(ValuationSnapshot.date.desc())
        .limit(1)
    )
    latest_snapshot = result.scalar_one_or_none()
    
    if not latest_snapshot:
        # 🔧 修正: データがない場合の適切なレスポンス
        return {
            "date": date.today().isoformat(),
            "total_value_jpy": 0.0,
            "total_value_usd": 0.0,
            "bitcoin_holdings": 0.0,
            "allocation_percentages": {},
            "currency_exposure": {},
            "account_type_breakdown": {},
            "fx_rates": {}
        }
    
    # Calculate additional metrics
    total_value = latest_snapshot.total_jpy
    
    # Asset allocation percentages
    allocation_percentages = {}
    if latest_snapshot.breakdown_by_category:  # データベースカラム名
        for asset_class, value in latest_snapshot.breakdown_by_category.items():
            allocation_percentages[asset_class] = (value / total_value * 100) if total_value > 0 else 0
    
    # Currency exposure
    currency_exposure = {}
    if latest_snapshot.breakdown_by_currency:
        # Convert all to JPY for comparison
        fx_rates = latest_snapshot.fx_rates or {}
        for currency, amount in latest_snapshot.breakdown_by_currency.items():
            if currency == "JPY":
                value_jpy = amount
            else:
                fx_rate = fx_rates.get(f"{currency}/JPY", 0)
                value_jpy = amount * fx_rate if fx_rate > 0 else 0
            
            currency_exposure[currency] = {
                "amount": amount,
                "value_jpy": value_jpy,
                "percentage": (value_jpy / total_value * 100) if total_value > 0 else 0
            }
    
    return {
        "date": latest_snapshot.date.isoformat(),
        "total_value_jpy": total_value,
        "total_value_usd": latest_snapshot.total_usd,
        "bitcoin_holdings": latest_snapshot.total_btc,
        "allocation_percentages": allocation_percentages,
        "currency_exposure": currency_exposure,
        "account_type_breakdown": latest_snapshot.breakdown_by_account_type,
        "fx_rates": latest_snapshot.fx_rates
    }

# 🔧 追加: デバッグ用エンドポイント
@router.get("/debug")
async def debug_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Debug endpoint to check dashboard state"""
    try:
        # Count holdings
        from app.models import Holding
        result = await db.execute(select(func.count(Holding.id)))
        holdings_count = result.scalar()
        
        # Count snapshots
        result = await db.execute(select(func.count(ValuationSnapshot.id)))
        snapshots_count = result.scalar()
        
        # Latest snapshot info
        result = await db.execute(
            select(ValuationSnapshot)
            .order_by(ValuationSnapshot.date.desc())
            .limit(1)
        )
        latest_snapshot = result.scalar_one_or_none()
        
        return {
            "holdings_count": holdings_count,
            "snapshots_count": snapshots_count,
            "latest_snapshot_date": latest_snapshot.date.isoformat() if latest_snapshot else None,
            "latest_snapshot_total": latest_snapshot.total_jpy if latest_snapshot else None,
        }
    except Exception as e:
        logger.error(f"Debug endpoint error: {e}")
        return {"error": str(e)}

# 🔧 追加: 価格取得エンドポイント（/api/prices/current の代替）
@router.get("/prices")
async def get_current_prices(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current prices for all assets"""
    try:
        from app.models import Asset, Price
        
        # Get all assets with their latest prices
        result = await db.execute(select(Asset))
        assets = result.scalars().all()
        
        prices = {}
        for asset in assets:
            # Get latest price for this asset
            result = await db.execute(
                select(Price)
                .where(Price.asset_id == asset.id)
                .order_by(Price.date.desc())
                .limit(1)
            )
            price = result.scalar_one_or_none()
            
            if price:
                prices[asset.symbol or asset.name] = {
                    "price": price.price,
                    "date": price.date.isoformat(),
                    "currency": asset.currency,
                    "source": price.source
                }
        
        return {"prices": prices, "timestamp": datetime.now().isoformat()}
    except Exception as e:
        logger.error(f"Error getting current prices: {e}")
        return {"prices": {}, "error": str(e)}