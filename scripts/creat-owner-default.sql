-- デフォルト名義人の作成（システム初期化用）
-- 既存のowner_typeのチェック
DO $$
BEGIN
    -- owner_typeが存在しない場合は作成
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'owner_type') THEN
        CREATE TYPE owner_type AS ENUM ('self', 'spouse', 'joint', 'child', 'other');
    END IF;
END $$;

-- デフォルト名義人が存在しない場合のみ作成
INSERT INTO owners (name, owner_type) 
SELECT '自分', 'self'
WHERE NOT EXISTS (
    SELECT 1 FROM owners WHERE owner_type = 'self' AND name = '自分'
);

-- 確認用クエリ
SELECT 
    id,
    name,
    owner_type,
    created_at
FROM owners 
ORDER BY created_at;