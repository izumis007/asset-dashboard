"""Initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2025-05-29 15:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from fastapi_users_db_sqlalchemy.generics import GUID

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enum types
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE assetclass AS ENUM ('CASHEQ', 'FIXED_INCOME', 'EQUITY', 'REAL_ASSET', 'CRYPTO');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE assettype AS ENUM ('SAVINGS', 'MMF', 'STABLECOIN', 'GOV_BOND', 'CORP_BOND', 'BOND_ETF', 'DIRECT_STOCK', 'EQUITY_ETF', 'MUTUAL_FUND', 'REIT', 'COMMODITY', 'GOLD_ETF', 'CRYPTO');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE region AS ENUM ('US', 'JP', 'EU', 'EM', 'GL');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE assetcategory AS ENUM ('EQUITY', 'ETF', 'FUND', 'BOND', 'CRYPTO', 'CASH');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE accounttype AS ENUM ('NISA', 'IDECO', 'TAXABLE');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Create assets table
    op.execute("""
        CREATE TABLE IF NOT EXISTS assets (
            id SERIAL PRIMARY KEY,
            symbol VARCHAR(20) NOT NULL,
            name VARCHAR(200) NOT NULL,
            asset_class assetclass,
            asset_type assettype,
            region region,
            category assetcategory,
            currency VARCHAR(3) NOT NULL DEFAULT 'JPY',
            exchange VARCHAR(50),
            isin VARCHAR(12),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE,
            CONSTRAINT _symbol_asset_type_uc UNIQUE (symbol, asset_type)
        );
    """)
    
    op.execute("CREATE INDEX IF NOT EXISTS ix_assets_id ON assets (id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_assets_symbol ON assets (symbol);")

    # Create users table
    op.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            username VARCHAR(50) NOT NULL UNIQUE,
            email VARCHAR(320) NOT NULL UNIQUE,
            hashed_password VARCHAR(1024) NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
            is_verified BOOLEAN NOT NULL DEFAULT TRUE,
            totp_secret VARCHAR(32),
            totp_enabled BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE
        );
    """)
    
    op.execute("CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);")

    # Create btc_trades table
    op.execute("""
        CREATE TABLE IF NOT EXISTS btc_trades (
            id SERIAL PRIMARY KEY,
            txid VARCHAR(100) UNIQUE,
            amount_btc FLOAT NOT NULL,
            counter_value_jpy FLOAT NOT NULL,
            jpy_rate FLOAT NOT NULL,
            fee_btc FLOAT DEFAULT 0,
            fee_jpy FLOAT DEFAULT 0,
            timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
            exchange VARCHAR(100),
            trade_type VARCHAR(10),
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE
        );
    """)
    
    op.execute("CREATE INDEX IF NOT EXISTS ix_btc_trades_id ON btc_trades (id);")

    # Create cash_balances table
    op.execute("""
        CREATE TABLE IF NOT EXISTS cash_balances (
            id SERIAL PRIMARY KEY,
            institution VARCHAR(100) NOT NULL,
            account_name VARCHAR(100),
            currency VARCHAR(3) NOT NULL DEFAULT 'JPY',
            amount FLOAT NOT NULL,
            timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE,
            source VARCHAR(50) DEFAULT 'money_forward'
        );
    """)
    
    op.execute("CREATE INDEX IF NOT EXISTS ix_cash_balances_id ON cash_balances (id);")

    # Create valuation_snapshots table
    op.execute("""
        CREATE TABLE IF NOT EXISTS valuation_snapshots (
            id SERIAL PRIMARY KEY,
            date DATE NOT NULL UNIQUE,
            total_jpy FLOAT NOT NULL,
            total_usd FLOAT NOT NULL,
            total_btc FLOAT NOT NULL,
            breakdown_by_category JSON,
            breakdown_by_currency JSON,
            breakdown_by_account_type JSON,
            fx_rates JSON,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    """)
    
    op.execute("CREATE INDEX IF NOT EXISTS ix_valuation_snapshots_id ON valuation_snapshots (id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_valuation_snapshots_date ON valuation_snapshots (date);")

    # Create holdings table (depends on assets)
    op.execute("""
        CREATE TABLE IF NOT EXISTS holdings (
            id SERIAL PRIMARY KEY,
            asset_id INTEGER NOT NULL REFERENCES assets(id),
            quantity FLOAT NOT NULL,
            cost_total FLOAT NOT NULL,
            acquisition_date DATE NOT NULL,
            account_type accounttype NOT NULL,
            broker VARCHAR(100),
            notes VARCHAR(500),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE
        );
    """)
    
    op.execute("CREATE INDEX IF NOT EXISTS ix_holdings_id ON holdings (id);")

    # Create prices table (depends on assets)
    op.execute("""
        CREATE TABLE IF NOT EXISTS prices (
            id SERIAL PRIMARY KEY,
            asset_id INTEGER NOT NULL REFERENCES assets(id),
            date DATE NOT NULL,
            price FLOAT NOT NULL,
            open FLOAT,
            high FLOAT,
            low FLOAT,
            volume FLOAT,
            source VARCHAR(50),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT _asset_date_uc UNIQUE (asset_id, date)
        );
    """)
    
    op.execute("CREATE INDEX IF NOT EXISTS ix_prices_id ON prices (id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_prices_date ON prices (date);")

    # Create additional performance indexes
    op.execute("CREATE INDEX IF NOT EXISTS idx_prices_asset_date ON prices(asset_id, date DESC);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_holdings_asset ON holdings(asset_id);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_btc_trades_timestamp ON btc_trades(timestamp DESC);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_valuation_snapshots_date_desc ON valuation_snapshots(date DESC);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_cash_balances_timestamp ON cash_balances(institution, timestamp DESC);")


def downgrade() -> None:
    # Drop tables in reverse order
    op.execute("DROP TABLE IF EXISTS prices CASCADE;")
    op.execute("DROP TABLE IF EXISTS holdings CASCADE;")
    op.execute("DROP TABLE IF EXISTS valuation_snapshots CASCADE;")
    op.execute("DROP TABLE IF EXISTS users CASCADE;")
    op.execute("DROP TABLE IF EXISTS cash_balances CASCADE;")
    op.execute("DROP TABLE IF EXISTS btc_trades CASCADE;")
    op.execute("DROP TABLE IF EXISTS assets CASCADE;")
    
    # Drop enum types
    op.execute("DROP TYPE IF EXISTS accounttype;")
    op.execute("DROP TYPE IF EXISTS assetcategory;")
    op.execute("DROP TYPE IF EXISTS region;")
    op.execute("DROP TYPE IF EXISTS assettype;")
    op.execute("DROP TYPE IF EXISTS assetclass;")