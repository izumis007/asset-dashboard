// ─────────────
// 共通型定義
// ─────────────

export interface User {
  id: string
  username: string
  email: string
  totp_enabled: boolean
}

// ─────────────
// 資産関連
// ─────────────

export type AssetCategory = 'equity' | 'etf' | 'fund' | 'bond' | 'crypto' | 'cash'

export interface Asset {
  id: number
  symbol: string
  name: string
  category: AssetCategory
  sub_category?: string
  currency: string
  exchange?: string
  isin?: string
}

export interface AssetCreate {
  symbol: string
  name: string
  category: AssetCategory
  sub_category?: string
  currency?: string
  exchange?: string
  isin?: string
}

export interface AssetUpdate {
  name?: string
  exchange?: string
  isin?: string
  sub_category?: string
}

// ─────────────
// 保有資産
// ─────────────

export type AccountType = 'NISA' | 'iDeCo' | 'taxable'

export interface Holding {
  id: number
  asset: Asset
  quantity: number
  cost_total: number
  acquisition_date: string
  account_type: AccountType
  broker?: string
  notes?: string
}

// ─────────────
// 価格情報
// ─────────────

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

// ─────────────
// BTC取引履歴
// ─────────────

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

// ─────────────
// ダッシュボード
// ─────────────

export interface DashboardData {
  total_jpy: number
  total_usd: number
  total_btc: number
  change_24h: number
  change_percentage: number
  breakdown_by_category: Record<string, number>
  breakdown_by_currency: Record<string, number>
  breakdown_by_account_type: Record<string, number>
  breakdown_by_sub_category?: Record<string, number>
  history: Array<{
    date: string
    total_jpy: number
    total_usd: number
  }>
}