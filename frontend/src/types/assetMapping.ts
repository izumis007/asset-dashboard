// frontend/src/types/assetMapping.ts
// 実際のデータベース構造に基づいたマッピング

import { AssetClass, AssetType } from './index'

export const ASSET_TYPE_BY_CLASS: Record<AssetClass, AssetType[]> = {
  'CASHEQ': [
    'SAVINGS',      // 普通預金
    'MMF',          // マネーマーケットファンド
    'STABLECOIN'    // ステーブルコイン
  ],
  'FIXED_INCOME': [
    'GOV_BOND',     // 国債
    'CORP_BOND',    // 社債
    'BOND_ETF'      // 債券ETF
  ],
  'EQUITY': [
    'DIRECT_STOCK', // 個別株
    'EQUITY_ETF',   // 株式ETF
    'MUTUAL_FUND'   // 投資信託
  ],
  'REAL_ASSET': [
    'REIT',         // REIT
    'COMMODITY',    // コモディティ
    'GOLD_ETF'      // 金ETF
  ],
  'CRYPTO': [
    'CRYPTO'        // 暗号資産
  ]
}

// AssetClassに基づいてAssetTypeの選択肢を取得する関数
export function getAssetTypesByClass(assetClass: AssetClass): AssetType[] {
  return ASSET_TYPE_BY_CLASS[assetClass] || []
}

// AssetTypeがAssetClassに適合するかチェックする関数
export function isValidAssetTypeForClass(assetClass: AssetClass, assetType: AssetType): boolean {
  return ASSET_TYPE_BY_CLASS[assetClass]?.includes(assetType) || false
}