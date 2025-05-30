from logging.config import fileConfig
import os
import sys
from sqlalchemy import engine_from_config, pool
from alembic import context
from dotenv import load_dotenv
load_dotenv()

# プロジェクトルートをパスに追加
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# ここでSQLAlchemyのBaseとモデルをインポート
from app.database import Base
from app.models.asset import Asset
from app.models.holding import Holding
from app.models.price import Price
from app.models.user import User
from app.models.btc_trade import BTCTrade
from app.models.valuation import ValuationSnapshot
from app.models.cash_balance import CashBalance

# Alembic Config
config = context.config

# 環境変数からDATABASE_URLを取得
DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL:
    # asyncpgからpsycopg2に変換（Alembic用）
    database_url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
    config.set_main_option("sqlalchemy.url", database_url)

# ログ設定
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# モデルのmetadataを指定
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()