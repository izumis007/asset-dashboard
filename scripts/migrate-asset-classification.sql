-- 新しい資産分類システムのマイグレーション

-- 新しいEnum型を作成
DO $$ BEGIN
    CREATE TYPE asset_class AS ENUM ('CashEq', 'FixedIncome', 'Equity', 'RealAsset', 'Crypto');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE asset_type AS ENUM (
        'Savings', 'MMF', 'Stablecoin', 'GovBond', 'CorpBond', 'BondETF',
        'DirectStock', 'EquityETF', 'MutualFund', 'REIT', 'Commodity', 'GoldETF', 'Crypto'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE region AS ENUM ('US', 'JP', 'EU', 'EM', 'GL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- assetsテーブルに新しいカラムを追加
ALTER TABLE assets 
ADD COLUMN IF NOT EXISTS asset_class asset_class,
ADD COLUMN IF NOT EXISTS asset_type asset_type,
ADD COLUMN IF NOT EXISTS region region;

-- 既存データの移行
UPDATE assets SET 
    asset_class = 'Equity',
    asset_type = 'DirectStock'
WHERE category = 'Equity';

UPDATE assets SET 
    asset_class = 'Equity',
    asset_type = 'EquityETF'
WHERE category = 'ETF';

UPDATE assets SET 
    asset_class = 'Equity',
    asset_type = 'MutualFund'
WHERE category = 'Fund';

UPDATE assets SET 
    asset_class = 'FixedIncome',
    asset_type = 'GovBond'
WHERE category = 'Bond';

UPDATE assets SET 
    asset_class = 'Crypto',
    asset_type = 'Crypto'
WHERE category = 'Crypto';

UPDATE assets SET 
    asset_class = 'CashEq',
    asset_type = 'Savings'
WHERE category = 'Cash';

-- 制約が存在しないときだけ追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = '_symbol_asset_type_uc'
    ) THEN
        ALTER TABLE assets ADD CONSTRAINT _symbol_asset_type_uc UNIQUE (symbol, asset_type);
    END IF;
END $$;

-- インデックスの更新
DROP INDEX IF EXISTS idx_assets_symbol_category;
CREATE INDEX IF NOT EXISTS idx_assets_symbol_asset_type ON assets(symbol, asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_asset_class ON assets(asset_class);
CREATE INDEX IF NOT EXISTS idx_assets_region ON assets(region);

-- 制約の更新
ALTER TABLE assets DROP CONSTRAINT IF EXISTS _symbol_category_uc;