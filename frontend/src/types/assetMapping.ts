// frontend/src/types/assetMapping.ts
// 新しい分類システムのマッピング（旧categoryシステム完全除去）

import { AssetClass, AssetType } from './index'

export const ASSET_TYPE_BY_CLASS: Record<AssetClass, AssetType[]> = {
  'CashEq': [
    'Savings',      // 普通預金
    'MMF',          // マネーマーケットファンド
    'Stablecoin'    // ステーブルコイン
  ],
  'FixedIncome': [
    'GovBond',     // 国債
    'CorpBond',    // 社債
    'BondETF'      // 債券ETF
  ],
  'Equity': [
    'DirectStock', // 個別株
    'EquityETF',   // 株式ETF
    'MutualFund',  // 投資信託
    'REIT'         // REIT（株式カテゴリに移動）
  ],
  'RealAsset': [
    'Commodity',   // コモディティ
    'GoldETF'      // 金ETF
  ],
  'Crypto': [
    'Crypto'       // 暗号資産
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

// 日本語ラベルマッピング
export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  CashEq: '現金等価物',
  FixedIncome: '債券',
  Equity: '株式',
  RealAsset: '実物資産',
  Crypto: '暗号資産',
}

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  Savings: '普通預金',
  MMF: 'マネーマーケットファンド',
  Stablecoin: 'ステーブルコイン',
  GovBond: '国債',
  CorpBond: '社債',
  BondETF: '債券ETF',
  DirectStock: '個別株',
  EquityETF: '株式ETF',
  MutualFund: '投資信託',
  REIT: 'REIT',
  Commodity: 'コモディティ',
  GoldETF: '金ETF',
  Crypto: '暗号資産',
}