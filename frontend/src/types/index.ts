// ─────────────────────────────
// 共通型定義
// ─────────────────────────────

export interface User {
  id: string
  username: string
  email: string
  totp_enabled: boolean
}

// 新しい階層化された資産分類システム
export type AssetClass =
  | 'CashEquivalents'
  | 'FixedIncome'
  | 'Equity'
  | 'RealEstate'
  | 'Commodity'
  | 'Crypto';

export type CashEqType = 'Savings' | 'MMF' | 'Stablecoin';
export type FixedIncomeType = 'GovernmentBond' | 'CorporateBond' | 'BondETF' | 'BondMutualFund';
export type EquityType = 'DirectStock' | 'EquityETF' | 'MutualFund' | 'ADR';
export type RealEstateType = 'REIT';
export type CommodityType = 'GoldETF' | 'CommodityETF' | 'PhysicalGold';
export type CryptoType = 'Crypto' | 'CryptoETF';
export type OwnerType = "self" | "spouse" | "child" | "special"

export type AssetType =
  | CashEqType
  | FixedIncomeType
  | EquityType
  | RealEstateType
  | CommodityType
  | CryptoType;

export type Region = 'US' | 'JP' | 'EU' | 'EM' | 'GL';

// UI用の分類マッピング
export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  CashEquivalents: '現金等価物',
  FixedIncome: '債券・固定収益',
  Equity: '株式',
  RealEstate: '不動産',
  Commodity: 'コモディティ',
  Crypto: '暗号資産'
};

export const ASSET_TYPE_OPTIONS: Record<AssetClass, { value: AssetType; label: string }[]> = {
  CashEquivalents: [
    { value: 'Savings', label: '普通預金' },
    { value: 'MMF', label: 'MMF' },
    { value: 'Stablecoin', label: 'ステーブルコイン' }
  ],
  FixedIncome: [
    { value: 'GovernmentBond', label: '国債' },
    { value: 'CorporateBond', label: '社債' },
    { value: 'BondETF', label: '債券ETF' },
    { value: 'BondMutualFund', label: '債券投信' }
  ],
  Equity: [
    { value: 'DirectStock', label: '個別株' },
    { value: 'EquityETF', label: '株式ETF' },
    { value: 'MutualFund', label: '株式投信' },
    { value: 'ADR', label: 'ADR' }
  ],
  RealEstate: [
    { value: 'REIT', label: 'REIT' }
  ],
  Commodity: [
    { value: 'GoldETF', label: '金ETF' },
    { value: 'CommodityETF', label: 'コモディティETF' },
    { value: 'PhysicalGold', label: '現物金' }
  ],
  Crypto: [
    { value: 'Crypto', label: '暗号資産' },
    { value: 'CryptoETF', label: '暗号資産ETF' }
  ]
};

// 通貨のデフォルト設定
export const DEFAULT_CURRENCY_BY_CLASS: Record<AssetClass, string> = {
  CashEquivalents: 'JPY',
  FixedIncome: 'JPY',
  Equity: 'USD',
  RealEstate: 'JPY',
  Commodity: 'USD',
  Crypto: 'BTC'
};

// ─────────────────────────────────────────────
// 資産 (Asset) の型定義
// ─────────────────────────────────────────────

export interface Asset {
  id: number
  symbol: string
  name: string
  asset_class: AssetClass        // 必須
  asset_type?: AssetType
  region?: Region
  sub_category?: string          // ←追加：自由記載のサブカテゴリ
  currency: string
  exchange?: string
  isin?: string
  display_category: string
}

// 新規作成用 (POST /api/assets)
export interface AssetCreate {
  symbol: string
  name: string
  asset_class: AssetClass
  asset_type?: AssetType
  region?: Region
  sub_category?: string          // ←追加
  currency: string
  exchange?: string
  isin?: string
}

// 更新用 (PUT /api/assets/:id)
export interface AssetUpdate {
  name?: string
  asset_class?: AssetClass
  asset_type?: AssetType
  region?: Region
  sub_category?: string          // ←追加
  currency?: string
  exchange?: string
  isin?: string
}

// ─────────────────────────────────────────────
// 保有資産関連の型定義
// ─────────────────────────────────────────────

export type AccountType = "NISA" | "iDeCo" | "taxable"

export interface HoldingForm {
  asset_id: number
  quantity: string
  cost_total: string
  acquisition_date: string
  account_type: AccountType
  broker: string
  notes: string
}

export interface Holding {
  id: number
  asset: Asset
  quantity: number
  cost_total: number
  acquisition_date: string
  account_type: 'NISA' | 'iDeCo' | 'taxable'
  broker?: string
  notes?: string
  cost_per_unit: number
  owner_type: OwnerType
  owner_name?: string
  account_number?: string
}

export interface HoldingCreate {
  asset_id: number
  quantity: number
  cost_total: number
  acquisition_date: string
  account_type: 'NISA' | 'iDeCo' | 'taxable'
  broker?: string
  notes?: string
}

// ─────────────────────────────────────────────
// 価格・取引関連の型定義
// ─────────────────────────────────────────────

export interface Price {
  id: number
  asset_id: number
  date: string
  price: number
  open?: number
  high?: number
  low?: number
  volume?: number
  source?: string
}

export interface BTCTrade {
  id: number
  txid?: string
  amount_btc: number
  counter_value_jpy: number
  jpy_rate: number
  fee_btc?: number
  fee_jpy?: number
  timestamp: string
  exchange?: string
  notes?: string
}

export interface BTCTradeCreate {
  txid?: string
  amount_btc: number
  counter_value_jpy: number
  jpy_rate: number
  fee_btc?: number
  fee_jpy?: number
  timestamp: string
  exchange?: string
  notes?: string
}

// ─────────────────────────────────────────────
// ダッシュボード関連の型定義
// ─────────────────────────────────────────────

export interface DashboardData {
  total_jpy: number
  total_usd: number
  total_btc: number
  change_24h: number
  change_percentage: number
  breakdown_by_category: Record<string, number>
  breakdown_by_currency: Record<string, number>
  breakdown_by_account_type: Record<string, number>
  history: Array<{
    date: string
    total_jpy: number
    total_usd: number
  }>
}