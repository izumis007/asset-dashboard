#!/bin/bash

echo "🔍 旧システム（category）の痕跡をチェックしています..."

# 旧システムの用語を検索
LEGACY_TERMS=("AssetCategory" "display_category" "asset_type.*equity" "asset_type.*etf" "asset_type.*fund" "asset_type.*bond" "asset_type.*cash" "category.*equity" "category.*etf" "category.*fund" "category.*bond" "category.*cash" "CASHEQ" "FIXED_INCOME" "EQUITY" "REAL_ASSET")

FOUND_ISSUES=0

for term in "${LEGACY_TERMS[@]}"; do
    echo "Checking for: $term"
    
    # TypeScriptファイルで検索
    results=$(find . -name "*.ts" -o -name "*.tsx" -o -name "*.py" | grep -v node_modules | grep -v .git | xargs grep -l "$term" 2>/dev/null)
    
    if [ ! -z "$results" ]; then
        echo "❌ Found '$term' in:"
        echo "$results"
        FOUND_ISSUES=$((FOUND_ISSUES + 1))
        echo ""
    fi
done

# 特定のファイルパターンをチェック
echo "Checking for .bak files..."
bak_files=$(find . -name "*.bak" | grep -v node_modules | grep -v .git)
if [ ! -z "$bak_files" ]; then
    echo "❌ Found .bak files (should be deleted):"
    echo "$bak_files"
    FOUND_ISSUES=$((FOUND_ISSUES + 1))
fi

echo ""
if [ $FOUND_ISSUES -eq 0 ]; then
    echo "✅ 旧システムの痕跡は見つかりませんでした！"
    echo "🎉 すべてのファイルが新しい分類システムに移行済みです。"
else
    echo "⚠️  $FOUND_ISSUES 個の問題が見つかりました。上記のファイルを確認してください。"
fi

echo ""
echo "📋 新しい分類システムの確認:"
echo "- AssetClass: CashEq, FixedIncome, Equity, RealAsset, Crypto"
echo "- AssetType: Savings, MMF, DirectStock, EquityETF, etc."
echo "- Region: US, JP, EU, DM, EM, GL"
echo "- OwnerType: self, spouse, joint, child, other"