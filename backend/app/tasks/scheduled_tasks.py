from celery import Celery
from celery.schedules import crontab
from datetime import datetime, date
import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.config import settings
from app.database import AsyncSessionLocal
from app.models import Asset, Price, Holding, ValuationSnapshot, CashBalance
from app.services.price_fetcher import PriceFetcher
from app.services.valuation_calculator import ValuationCalculator

logger = logging.getLogger(__name__)

# Create Celery app with error handling
try:
    celery_app = Celery(
        'tasks',
        broker=settings.REDIS_URL,
        backend=settings.REDIS_URL
    )
    
    # Configure Celery
    celery_app.conf.update(
        timezone=settings.TIMEZONE,
        enable_utc=True,
        beat_schedule={
            'fetch-daily-prices': {
                'task': 'app.tasks.scheduled_tasks.fetch_daily_prices',
                'schedule': crontab(
                    hour=settings.PRICE_FETCH_HOUR,
                    minute=settings.PRICE_FETCH_MINUTE
                ),
            },
            'calculate-daily-valuation': {
                'task': 'app.tasks.scheduled_tasks.calculate_daily_valuation',
                'schedule': crontab(
                    hour=settings.PRICE_FETCH_HOUR,
                    minute=settings.PRICE_FETCH_MINUTE + 10  # 10 minutes after price fetch
                ),
            },
            'scrape-money-forward': {
                'task': 'app.tasks.scheduled_tasks.scrape_money_forward',
                'schedule': crontab(
                    hour=settings.PRICE_FETCH_HOUR,
                    minute=settings.PRICE_FETCH_MINUTE + 20  # 20 minutes after price fetch
                ),
            },
        }
    )
    
    CELERY_AVAILABLE = True
    logger.info("Celery configured successfully")
    
except Exception as e:
    logger.warning(f"Celery configuration failed: {e}")
    # 🔧 修正: Celeryが利用できない場合のダミーアプリ
    class DummyCeleryApp:
        def task(self, *args, **kwargs):
            def decorator(func):
                return func
            return decorator
        
        def delay(self, *args, **kwargs):
            class DummyTask:
                id = None
            return DummyTask()
    
    celery_app = DummyCeleryApp()
    CELERY_AVAILABLE = False

def setup_periodic_tasks():
    """Called on app startup to ensure beat schedule is registered"""
    if CELERY_AVAILABLE:
        logger.info("Periodic tasks configured")
    else:
        logger.warning("Celery not available - periodic tasks disabled")

@celery_app.task
def fetch_daily_prices():
    """Fetch latest prices for all assets"""
    if not CELERY_AVAILABLE:
        logger.warning("Celery not available - skipping price fetch")
        return
    asyncio.run(_fetch_daily_prices())

async def _fetch_daily_prices():
    async with AsyncSessionLocal() as db:
        try:
            # Get all unique assets from holdings
            result = await db.execute(
                select(Asset).distinct()
            )
            assets = result.scalars().all()
            
            price_fetcher = PriceFetcher()
            
            for asset in assets:
                try:
                    # Skip if we already have today's price
                    existing = await db.execute(
                        select(Price).where(
                            Price.asset_id == asset.id,
                            Price.date == date.today()
                        )
                    )
                    if existing.scalar_one_or_none():
                        continue
                    
                    # 🔧 修正: symbolがNoneの場合をスキップ
                    if not asset.symbol:
                        logger.warning(f"Skipping asset {asset.name} - no symbol")
                        continue
                    
                    # Fetch price based on asset type
                    # 🔧 修正: asset_class は Enum なので .value でアクセス
                    if asset.asset_class and asset.asset_class.value == "Crypto":
                        price_data = await price_fetcher.fetch_crypto_price(asset.symbol.lower())
                    else:
                        price_data = await price_fetcher.fetch_price(asset.symbol)
                    
                    if price_data:
                        # Save price
                        price = Price(
                            asset_id=asset.id,
                            date=price_data['date'],
                            price=price_data['price'],
                            open=price_data.get('open'),
                            high=price_data.get('high'),
                            low=price_data.get('low'),
                            volume=price_data.get('volume'),
                            source=price_data.get('source')
                        )
                        db.add(price)
                        logger.info(f"Fetched price for {asset.symbol}: {price_data['price']}")
                    
                except Exception as e:
                    logger.error(f"Error fetching price for {asset.symbol}: {e}")
            
            await db.commit()
            logger.info("Daily price fetch completed")
            
        except Exception as e:
            logger.error(f"Error in daily price fetch: {e}")

@celery_app.task
def calculate_daily_valuation():
    """Calculate and store daily valuation snapshot"""
    if not CELERY_AVAILABLE:
        logger.warning("Celery not available - skipping valuation calculation")
        return
    asyncio.run(_calculate_daily_valuation())

async def _calculate_daily_valuation():
    async with AsyncSessionLocal() as db:
        try:
            calculator = ValuationCalculator(db)
            snapshot = await calculator.calculate_snapshot()
            
            if snapshot:
                db.add(snapshot)
                await db.commit()
                logger.info(f"Daily valuation calculated: {snapshot.total_jpy:,.0f} JPY")
            
        except Exception as e:
            logger.error(f"Error in daily valuation calculation: {e}")

@celery_app.task
def scrape_money_forward():
    """Run Money Forward scraper"""
    if not CELERY_AVAILABLE:
        logger.warning("Celery not available - skipping Money Forward scrape")
        return
    asyncio.run(_scrape_money_forward())

async def _scrape_money_forward():
    try:
        # This will call the Node.js scraper service
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://scraper:3001/scrape",
                json={
                    "email": settings.MONEY_FORWARD_EMAIL,
                    "password": settings.MONEY_FORWARD_PASSWORD
                },
                timeout=300.0  # 5 minute timeout for scraping
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Save cash balances
                async with AsyncSessionLocal() as db:
                    for balance in data.get("balances", []):
                        cash_balance = CashBalance(
                            institution=balance["institution"],
                            account_name=balance.get("account_name"),
                            currency=balance.get("currency", "JPY"),
                            amount=balance["amount"],
                            timestamp=datetime.now()
                        )
                        db.add(cash_balance)
                    
                    await db.commit()
                    logger.info(f"Scraped {len(data.get('balances', []))} balances from Money Forward")
            
    except Exception as e:
        logger.error(f"Error in Money Forward scraper: {e}")

# Manual task triggers
@celery_app.task
def trigger_price_fetch():
    """Manually trigger price fetch"""
    if not CELERY_AVAILABLE:
        logger.warning("Celery not available - cannot trigger price fetch")
        return {"status": "error", "message": "Celery not available"}
    return fetch_daily_prices()

@celery_app.task
def trigger_valuation_calculation():
    """Manually trigger valuation calculation"""
    if not CELERY_AVAILABLE:
        logger.warning("Celery not available - cannot trigger valuation calculation")
        return {"status": "error", "message": "Celery not available"}
    return calculate_daily_valuation()

@celery_app.task
def trigger_money_forward_scrape():
    """Manually trigger Money Forward scrape"""
    if not CELERY_AVAILABLE:
        logger.warning("Celery not available - cannot trigger Money Forward scrape")
        return {"status": "error", "message": "Celery not available"}
    return scrape_money_forward()