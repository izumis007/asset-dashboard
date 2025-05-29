// ─────────────────────────────
// 共通型定義
// ─────────────────────────────

export interface User {
  id: string
  username: string
  email: string
  totp_enabled: boolean
}

// 新しい分類システム
export type AssetClass = 'CashEq' | 'FixedIncome' | 'Equity' | 'RealAsset' | 'Crypto'
export type AssetType = 'Savings' | 'MMF' | 'Stablecoin' | 'GovBond' | 'CorpBond' | 'BondETF' | 'DirectStock' | 'EquityETF' | 'MutualFund' | 'REIT' | 'Commodity' | 'GoldETF' | 'Crypto'
export type Region = 'US' | 'JP' | 'EU' | 'EM' | 'GL'

// 旧分類システム（後方互換性）
export type AssetCategory = 'equity' | 'etf' | 'fund' | 'bond' | 'crypto' | 'cash'

// ─────────────────────────────────────────────
// 資産 (Asset) のレスポンス型
// ─────────────────────────────────────────────

export interface Asset {
  id: number
  symbol: string
  name: string
  asset_class?: AssetClass
  asset_type?: AssetType
  region?: Region
  currency: string
  exchange?: string
  isin?: string
  // 後方互換性のため
  category?: AssetCategory
  sub_category?: string
  // 表示用
  display_category: string
}

// ─────────────────────────────────────────────
// 新規作成用 (POST /api/assets)
// ─────────────────────────────────────────────

export interface AssetCreate {
  symbol: string
  name: string
  asset_class: AssetClass
  asset_type?: AssetType
  region?: Region
  currency: string
  exchange?: string
  isin?: string
}

// ─────────────────────────────────────────────
// 更新用 (PUT /api/assets/:id)
// ─────────────────────────────────────────────

export interface AssetUpdate {
  name?: string
  asset_class?: AssetClass
  asset_type?: AssetType
  region?: Region
  currency?: string
  exchange?: string
  isin?: string
}

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