-- 名義管理機能のマイグレーション

-- 新しいEnum型を作成
DO $$ BEGIN
    CREATE TYPE owner_type AS ENUM ('self', 'spouse', 'joint', 'child', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- account_type に新しい値を追加
ALTER TYPE account_type ADD VALUE IF NOT EXISTS 'special';

-- holdingsテーブルに名義関連カラムを追加
ALTER TABLE holdings 
ADD COLUMN IF NOT EXISTS owner_type owner_type DEFAULT 'self',
ADD COLUMN IF NOT EXISTS owner_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS account_number VARCHAR(50);

-- 既存データを'self'に設定
UPDATE holdings SET owner_type = 'self' WHERE owner_type IS NULL;

-- owner_typeをNOT NULLに変更
ALTER TABLE holdings ALTER COLUMN owner_type SET NOT NULL;

-- valuation_snapshotsテーブルに名義別内訳カラムを追加
ALTER TABLE valuation_snapshots 
ADD COLUMN IF NOT EXISTS breakdown_by_owner JSON;

-- 新しいインデックスを作成
CREATE INDEX IF NOT EXISTS idx_holdings_owner_type ON holdings(owner_type);
CREATE INDEX IF NOT EXISTS idx_holdings_owner_type_name ON holdings(owner_type, owner_name);

-- 既存のvaluation snapshotにダミーの名義別内訳を追加（必要に応じて）
UPDATE valuation_snapshots 
SET breakdown_by_owner = json_build_object('self', total_jpy)
WHERE breakdown_by_owner IS NULL;