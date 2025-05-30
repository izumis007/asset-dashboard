// =====================================
// Asset Dashboard TypeScript Types
// データベースの実際の構造に合わせて修正　
// 完全バージョン！！！
// =====================================

// ─────────────────────────────
// 基本的なユーザー型
// ─────────────────────────────
export interface User {
  id: string
  username: string
  email: string
  totp_enabled: boolean
}

// ─────────────────────────────
// 資産分類システム（データベースと一致）
// ─────────────────────────────
export type AssetClass = 
  | 'CASHEQ'          // 現金等価物
  | 'FIXED_INCOME'    // 債券
  | 'EQUITY'          // 株式
  | 'REAL_ASSET'      // 実物資産
  | 'CRYPTO'          // 暗号資産

export type AssetType = 
  | 'SAVINGS'         // 普通預金
  | 'MMF'            // マネーマーケットファンド
  | 'STABLECOIN'     // ステーブルコイン
  | 'GOV_BOND'       // 国債
  | 'CORP_BOND'      // 社債
  | 'BOND_ETF'       // 債券ETF
  | 'DIRECT_STOCK'   // 個別株
  | 'EQUITY_ETF'     // 株式ETF
  | 'MUTUAL_FUND'    // 投資信託
  | 'REIT'           // REIT
  | 'COMMODITY'      // コモディティ
  | 'GOLD_ETF'       // 金ETF
  | 'CRYPTO'         // 暗号資産

export type Region = 
  | 'US'             // アメリカ
  | 'JP'             // 日本
  | 'EU'             // ヨーロッパ
  | 'EM'             // 新興国
  | 'GL'             // グローバル
  | 'DM'             // 先進国

// ─────────────────────────────
// 口座の種類（データベースと一致）
// ─────────────────────────────
export type AccountType = 
  | 'NISA'           // NISA口座
  | 'IDECO'          // iDeCo口座（DBでは'IDECO'）
  | 'TAXABLE'        // 課税口座

// ─────────────────────────────
// 資産関連の型定義
// ─────────────────────────────

// 資産のレスポンス型（APIから取得される形式）
export interface Asset {
  id: number
  symbol: string
  name: string
  asset_class: AssetClass        // 必須
  asset_type?: AssetType         // 任意
  region?: Region               // 任意
  sub_category?: string         // カスタムサブカテゴリ
  currency: string
  exchange?: string
  isin?: string
  display_category: string      // 表示用カテゴリ
}

// 資産作成用の型（APIに送信する形式）
export interface AssetCreate {
  symbol: string
  name: string
  asset_class: AssetClass       // 必須
  asset_type?: AssetType        // 任意
  region?: Region              // 任意
  sub_category?: string        // 任意
  currency: string
  exchange?: string
  isin?: string
}

// 資産更新用の型
export interface AssetUpdate {
  name?: string
  asset_class?: AssetClass
  asset_type?: AssetType
  region?: Region
  sub_category?: string
  currency?: string
  exchange?: string
  isin?: string
}

// ─────────────────────────────
// 保有資産関連の型定義
// ─────────────────────────────

// 保有資産のフォーム用型
export interface HoldingForm {
  asset_id: number
  quantity: string
  cost_total: string
  acquisition_date: string
  account_type: AccountType
  broker: string
  notes: string
}

// 保有資産のレスポンス型
export interface Holding {
  id: number
  asset: Asset
  quantity: number
  cost_total: number
  acquisition_date: string
  account_type: AccountType
  broker?: string
  notes?: string
  cost_per_unit: number
}

// 保有資産作成用の型
export interface HoldingCreate {
  asset_id: number
  quantity: number
  cost_total: number
  acquisition_date: string
  account_type: AccountType
  broker?: string
  notes?: string
}

// ─────────────────────────────
// 価格関連の型定義
// ─────────────────────────────
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

// ─────────────────────────────
// BTC取引関連の型定義
// ─────────────────────────────
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

// ─────────────────────────────
// ダッシュボード関連の型定義
// ─────────────────────────────
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

// ─────────────────────────────
// API エンドポイント用の型定義
// ─────────────────────────────

// enum取得APIのレスポンス型
export interface AssetEnums {
  asset_classes: Array<{ value: AssetClass; label: string }>
  asset_types: Array<{ value: AssetType; label: string }>
  regions: Array<{ value: Region; label: string }>
}

// ─────────────────────────────
// 日本語ラベルのマッピング
// ─────────────────────────────

export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  'CASHEQ': '現金等価物',
  'FIXED_INCOME': '債券',
  'EQUITY': '株式',
  'REAL_ASSET': '実物資産',
  'CRYPTO': '暗号資産'
}

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  'SAVINGS': '普通預金',
  'MMF': 'マネーマーケットファンド',
  'STABLECOIN': 'ステーブルコイン',
  'GOV_BOND': '国債',
  'CORP_BOND': '社債',
  'BOND_ETF': '債券ETF',
  'DIRECT_STOCK': '個別株',
  'EQUITY_ETF': '株式ETF',
  'MUTUAL_FUND': '投資信託',
  'REIT': 'REIT',
  'COMMODITY': 'コモディティ',
  'GOLD_ETF': '金ETF',
  'CRYPTO': '暗号資産'
}

export const REGION_LABELS: Record<Region, string> = {
  'US': 'アメリカ',
  'JP': '日本',
  'EU': 'ヨーロッパ',
  'EM': '新興国',
  'DM': '先進国',
  'GL': 'グローバル'
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  'NISA': 'NISA',
  'IDECO': 'iDeCo',
  'TAXABLE': '課税口座'
}

// ─────────────────────────────
// 型ガード関数
// ─────────────────────────────

export function isAssetClass(value: string): value is AssetClass {
  return ['CASHEQ', 'FIXED_INCOME', 'EQUITY', 'REAL_ASSET', 'CRYPTO'].includes(value)
}

export function isAssetType(value: string): value is AssetType {
  return [
    'SAVINGS', 'MMF', 'STABLECOIN', 'GOV_BOND', 'CORP_BOND', 'BOND_ETF',
    'DIRECT_STOCK', 'EQUITY_ETF', 'MUTUAL_FUND', 'REIT', 'COMMODITY', 'GOLD_ETF', 'CRYPTO'
  ].includes(value)
}

export function isRegion(value: string): value is Region {
  return ['US', 'JP', 'EU', 'EM', 'DM', 'GL'].includes(value)
}

export function isAccountType(value: string): value is AccountType {
  return ['NISA', 'IDECO', 'TAXABLE'].includes(value)
}