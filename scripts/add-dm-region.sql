-- Region enumに'DM'（先進国）を追加

ALTER TYPE region ADD VALUE IF NOT EXISTS 'DM';

-- 既存のassetテーブルにDMを設定したい場合の例
-- UPDATE assets SET region = 'DM' WHERE symbol IN ('VTI', 'VXUS', '1306') AND region IS NULL;