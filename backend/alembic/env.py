from logging.config import fileConfig
import logging
import os
import sys
from sqlalchemy import engine_from_config, pool
from alembic import context
from dotenv import load_dotenv
load_dotenv()

# 詳細ログ設定
logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.DEBUG)
logging.getLogger('alembic.runtime.migration').setLevel(logging.DEBUG)

# プロジェクトルートをパスに追加
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# モデルのインポート
from app.database import Base
from app.models.asset import Asset
from app.models.owner import Owner
from app.models.holding import Holding
from app.models.price import Price
from app.models.user import User
from app.models.btc_trade import BTCTrade
from app.models.valuation import ValuationSnapshot
from app.models.cash_balance import CashBalance

# Alembic の設定オブジェクト取得
config = context.config

# 🔧 修正: DATABASE_URL の正しい変換処理
DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL:
    # asyncpg -> psycopg2 変換（同期用）
    if "postgresql+asyncpg://" in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
    elif DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)
    
    print(f"💡 DATABASE_URL converted for Alembic: {DATABASE_URL}")
    config.set_main_option("sqlalchemy.url", DATABASE_URL)
else:
    raise ValueError("DATABASE_URL environment variable is required")

# ファイル設定に基づくログ出力
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# メタデータを指定（自動マイグレーション用）
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """'Offline' モードでマイグレーションを実行します（DB接続なし）。"""
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
    """'Online' モードでマイグレーションを実行します（DBに接続して実行）。"""
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

# 実行モードの判定とマイグレーションの実行
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()