-- Create database if not exists
SELECT 'CREATE DATABASE asset_dashboard'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'asset_dashboard')\gexec

-- Connect to the database
\c asset_dashboard;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE asset_category AS ENUM ('equity', 'etf', 'fund', 'bond', 'crypto', 'cash');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE account_type AS ENUM ('NISA', 'iDeCo', 'taxable');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prices_asset_date ON prices(asset_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_holdings_asset ON holdings(asset_id);
CREATE INDEX IF NOT EXISTS idx_btc_trades_timestamp ON btc_trades(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_valuation_snapshots_date ON valuation_snapshots(date DESC);
CREATE INDEX IF NOT EXISTS idx_cash_balances_timestamp ON cash_balances(institution, timestamp DESC);