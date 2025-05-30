from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, date, timedelta
from typing import Dict, List

from app.database import get_db
from app.models import User, ValuationSnapshot
from app.api.auth import get_current_user
from app.services.valuation_calculator import ValuationCalculator
from app.tasks.scheduled_tasks import trigger_price_fetch
from pydantic import BaseModel

router = APIRouter()

# Response models
class DashboardOverview(BaseModel):
    total_jpy: float
    total_usd: float
    total_btc: float
    change_24h: float
    change_percentage: float
    breakdown_by_asset_class: Dict[str, float]  # 既に修正済み
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
        # Calculate if no snapshot exists
        calculator = ValuationCalculator(db)
        latest_snapshot = await calculator.calculate_snapshot()
        if latest_snapshot:
            db.add(latest_snapshot)
            await db.commit()
        else:
            raise HTTPException(status_code=404, detail="No valuation data available")
    
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
    
    return DashboardOverview(
        total_jpy=latest_snapshot.total_jpy,
        total_usd=latest_snapshot.total_usd,
        total_btc=latest_snapshot.total_btc,
        change_24h=change_24h,
        change_percentage=change_percentage,
        breakdown_by_asset_class=latest_snapshot.breakdown_by_asset_class or {},  # 修正: breakdown_by_categoryからbreakdown_by_asset_classに
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
            "breakdown_by_asset_class": snapshot.breakdown_by_asset_class,  # 修正: breakdown_by_categoryからbreakdown_by_asset_classに
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
    
    # Trigger price fetch task
    task = trigger_price_fetch.delay()
    
    return RefreshResponse(
        message="Price refresh initiated",
        task_id=task.id if hasattr(task, 'id') else None
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
        raise HTTPException(status_code=404, detail="No valuation data available")
    
    # Calculate additional metrics
    total_value = latest_snapshot.total_jpy
    
    # Asset allocation percentages
    allocation_percentages = {}
    if latest_snapshot.breakdown_by_asset_class:  # 修正: breakdown_by_categoryからbreakdown_by_asset_classに
        for asset_class, value in latest_snapshot.breakdown_by_asset_class.items():  # 修正: categoryからasset_classに変数名変更
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