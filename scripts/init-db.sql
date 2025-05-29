-- Create database if not exists
SELECT 'CREATE DATABASE asset_dashboard'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'asset_dashboard')\gexec

-- Connect to the database
\c asset_dashboard;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Everything else will be handled by Alembic