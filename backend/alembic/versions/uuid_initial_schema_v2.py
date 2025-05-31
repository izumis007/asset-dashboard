"""Initial UUID-based schema with data quality improvements

Revision ID: uuid_initial_schema_v2
Revises: 
Create Date: 2025-05-30 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from fastapi_users_db_sqlalchemy.generics import GUID

# revision identifiers, used by Alembic.
revision: str = 'uuid_initial_schema_v2'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable UUID extension
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    
    # Create custom types
    op.execute("CREATE TYPE asset_class AS ENUM ('CashEq', 'FixedIncome', 'Equity', 'RealAsset', 'Crypto')")
    op.execute("CREATE TYPE asset_type AS ENUM ('Savings', 'MMF', 'Stablecoin', 'GovBond', 'CorpBond', 'BondETF', 'DirectStock', 'EquityETF', 'MutualFund', 'REIT', 'Commodity', 'GoldETF', 'Crypto')")
    op.execute("CREATE TYPE region AS ENUM ('US', 'JP', 'EU', 'DM', 'EM', 'GL')")
    op.execute("CREATE TYPE account_type AS ENUM ('NISA_growth', 'NISA_reserve', 'iDeCo', 'DC', 'specific', 'general')")
    op.execute("CREATE TYPE owner_type AS ENUM ('self', 'spouse', 'joint', 'child', 'other')")
    op.execute("CREATE TYPE trade_type AS ENUM ('buy', 'sell', 'transfer')")

    # Create users table (unchanged, using fastapi-users structure)
    op.create_table('users',
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('totp_secret', sa.String(length=32), nullable=True),
        sa.Column('totp_enabled', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False),
        sa.Column('id', GUID(), nullable=False),
        sa.Column('email', sa.String(length=320), nullable=False),
        sa.Column('hashed_password', sa.String(length=1024), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('is_superuser', sa.Boolean(), nullable=False),
        sa.Column('is_verified', sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('username')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # Create owners table for 名義管理
    op.create_table('owners',
        sa.Column('id', UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),  # 名義人名（必須）
        sa.Column('owner_type', sa.Enum('self', 'spouse', 'joint', 'child', 'other', name='owner_type'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_owners_id'), 'owners', ['id'], unique=False)
    op.create_index('ix_owners_owner_type', 'owners', ['owner_type'], unique=False)

    # Create assets table with improved data quality constraints
    op.create_table('assets',
        sa.Column('id', UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('symbol', sa.String(length=20), nullable=True),  # ティッカーは任意（現物資産対応）
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('asset_class', sa.Enum('CashEq', 'FixedIncome', 'Equity', 'RealAsset', 'Crypto', name='asset_class'), nullable=False),  # 必須分類
        sa.Column('asset_type', sa.Enum('Savings', 'MMF', 'Stablecoin', 'GovBond', 'CorpBond', 'BondETF', 'DirectStock', 'EquityETF', 'MutualFund', 'REIT', 'Commodity', 'GoldETF', 'Crypto', name='asset_type'), nullable=True),  # 詳細分類は任意
        sa.Column('region', sa.Enum('US', 'JP', 'EU', 'DM', 'EM', 'GL', name='region'), nullable=True),  # 地域は任意
        sa.Column('sub_category', sa.String(length=100), nullable=True),  # サブカテゴリ追加
        sa.Column('currency', sa.String(length=3), nullable=False, server_default='JPY'),
        sa.Column('exchange', sa.String(length=50), nullable=True),
        sa.Column('isin', sa.String(length=12), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_assets_id'), 'assets', ['id'], unique=False)
    op.create_index(op.f('ix_assets_symbol'), 'assets', ['symbol'], unique=False)
    op.create_index('ix_assets_asset_class', 'assets', ['asset_class'], unique=False)  # 分類検索用
    op.create_index('ix_assets_asset_type', 'assets', ['asset_type'], unique=False)   # 詳細分類検索用
    
    # Unique constraint on symbol + asset_type (nulls are ignored automatically)
    op.create_unique_constraint('_symbol_asset_type_uc', 'assets', ['symbol', 'asset_type'])

    # Create holdings table with UUID and owner relationship
    op.create_table('holdings',
        sa.Column('id', UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('asset_id', UUID(as_uuid=True), nullable=False),
        sa.Column('owner_id', UUID(as_uuid=True), nullable=False),  # 名義人（必須）
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('cost_total', sa.Float(), nullable=False),
        sa.Column('acquisition_date', sa.Date(), nullable=False),
        sa.Column('account_type', sa.Enum('NISA_growth', 'NISA_reserve', 'iDeCo', 'DC', 'specific', 'general', name='account_type'), nullable=False),
        sa.Column('broker', sa.String(length=100), nullable=True),
        sa.Column('notes', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['asset_id'], ['assets.id'], ),
        sa.ForeignKeyConstraint(['owner_id'], ['owners.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_holdings_id'), 'holdings', ['id'], unique=False)
    op.create_index('ix_holdings_asset_id', 'holdings', ['asset_id'], unique=False)
    op.create_index('ix_holdings_owner_id', 'holdings', ['owner_id'], unique=False)
    op.create_index('ix_holdings_account_type', 'holdings', ['account_type'], unique=False)

    # Create prices table with UUID
    op.create_table('prices',
        sa.Column('id', UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('asset_id', UUID(as_uuid=True), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('price', sa.Float(), nullable=False),
        sa.Column('open', sa.Float(), nullable=True),
        sa.Column('high', sa.Float(), nullable=True),
        sa.Column('low', sa.Float(), nullable=True),
        sa.Column('volume', sa.Float(), nullable=True),
        sa.Column('source', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['asset_id'], ['assets.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('asset_id', 'date', name='_asset_date_uc')
    )
    op.create_index(op.f('ix_prices_id'), 'prices', ['id'], unique=False)
    op.create_index(op.f('ix_prices_date'), 'prices', ['date'], unique=False)
    op.create_index('ix_prices_asset_date', 'prices', ['asset_id', 'date'], unique=False)  # 複合インデックス

    # Create BTC trades table with UUID (統一性向上)
    op.create_table('btc_trades',
        sa.Column('id', UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('txid', sa.String(length=100), nullable=True),
        sa.Column('amount_btc', sa.Float(), nullable=False),
        sa.Column('counter_value_jpy', sa.Float(), nullable=False),
        sa.Column('jpy_rate', sa.Float(), nullable=False),
        sa.Column('fee_btc', sa.Float(), nullable=True, server_default='0'),
        sa.Column('fee_jpy', sa.Float(), nullable=True, server_default='0'),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('exchange', sa.String(length=100), nullable=True),
        sa.Column('trade_type', sa.Enum('buy', 'sell', 'transfer', name='trade_type'), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('txid')
    )
    op.create_index(op.f('ix_btc_trades_id'), 'btc_trades', ['id'], unique=False)
    op.create_index('ix_btc_trades_timestamp', 'btc_trades', ['timestamp'], unique=False)
    op.create_index('ix_btc_trades_trade_type', 'btc_trades', ['trade_type'], unique=False)

    # Create cash balances table with UUID
    op.create_table('cash_balances',
        sa.Column('id', UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('institution', sa.String(length=100), nullable=False),
        sa.Column('account_name', sa.String(length=100), nullable=True),
        sa.Column('currency', sa.String(length=3), nullable=False, server_default='JPY'),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('source', sa.String(length=50), nullable=True, server_default='money_forward'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cash_balances_id'), 'cash_balances', ['id'], unique=False)
    op.create_index('ix_cash_balances_institution_timestamp', 'cash_balances', ['institution', 'timestamp'], unique=False)
    op.create_index('ix_cash_balances_currency', 'cash_balances', ['currency'], unique=False)

    # Create valuation snapshots table with UUID
    op.create_table('valuation_snapshots',
        sa.Column('id', UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('total_jpy', sa.Float(), nullable=False),
        sa.Column('total_usd', sa.Float(), nullable=False),
        sa.Column('total_btc', sa.Float(), nullable=False),
        sa.Column('breakdown_by_category', sa.JSON(), nullable=True),
        sa.Column('breakdown_by_currency', sa.JSON(), nullable=True),
        sa.Column('breakdown_by_account_type', sa.JSON(), nullable=True),
        sa.Column('fx_rates', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_valuation_snapshots_id'), 'valuation_snapshots', ['id'], unique=False)
    op.create_index(op.f('ix_valuation_snapshots_date'), 'valuation_snapshots', ['date'], unique=True)


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_index(op.f('ix_valuation_snapshots_date'), table_name='valuation_snapshots')
    op.drop_index(op.f('ix_valuation_snapshots_id'), table_name='valuation_snapshots')
    op.drop_table('valuation_snapshots')
    
    op.drop_index('ix_cash_balances_currency', table_name='cash_balances')
    op.drop_index('ix_cash_balances_institution_timestamp', table_name='cash_balances')
    op.drop_index(op.f('ix_cash_balances_id'), table_name='cash_balances')
    op.drop_table('cash_balances')
    
    op.drop_index('ix_btc_trades_trade_type', table_name='btc_trades')
    op.drop_index('ix_btc_trades_timestamp', table_name='btc_trades')
    op.drop_index(op.f('ix_btc_trades_id'), table_name='btc_trades')
    op.drop_table('btc_trades')
    
    op.drop_index('ix_prices_asset_date', table_name='prices')
    op.drop_index(op.f('ix_prices_date'), table_name='prices')
    op.drop_index(op.f('ix_prices_id'), table_name='prices')
    op.drop_table('prices')
    
    op.drop_index('ix_holdings_account_type', table_name='holdings')
    op.drop_index('ix_holdings_owner_id', table_name='holdings')
    op.drop_index('ix_holdings_asset_id', table_name='holdings')
    op.drop_index(op.f('ix_holdings_id'), table_name='holdings')
    op.drop_table('holdings')
    
    op.drop_index('ix_assets_asset_type', table_name='assets')
    op.drop_index('ix_assets_asset_class', table_name='assets')
    op.drop_index(op.f('ix_assets_symbol'), table_name='assets')
    op.drop_index(op.f('ix_assets_id'), table_name='assets')
    op.drop_table('assets')
    
    op.drop_index('ix_owners_owner_type', table_name='owners')
    op.drop_index(op.f('ix_owners_id'), table_name='owners')
    op.drop_table('owners')
    
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    
    # Drop custom types
    op.execute("DROP TYPE IF EXISTS trade_type") 
    op.execute("DROP TYPE IF EXISTS owner_type")
    op.execute("DROP TYPE IF EXISTS account_type")
    op.execute("DROP TYPE IF EXISTS region")
    op.execute("DROP TYPE IF EXISTS asset_type")
    op.execute("DROP TYPE IF EXISTS asset_class")