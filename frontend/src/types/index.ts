// ─────────────────────────────
// 共通型定義
// ─────────────────────────────

export interface User {
    id: string
    username: string
    email: string
    totp_enabled: boolean
  }
  
  // 新しい分類システム（旧AssetCategory完全除去）
  export type AssetClass = 'CashEq' | 'FixedIncome' | 'Equity' | 'RealAsset' | 'Crypto'
  export type AssetType = 'Savings' | 'MMF' | 'Stablecoin' | 'GovBond' | 'CorpBond' | 'BondETF' | 'DirectStock' | 'EquityETF' | 'MutualFund' | 'REIT' | 'Commodity' | 'GoldETF' | 'Crypto'
  export type Region = 'US' | 'JP' | 'EU' | 'DM' | 'EM' | 'GL'
  
  // 名義管理
  export type OwnerType = 'self' | 'spouse' | 'joint' | 'child' | 'other'
  
  export interface Owner {
    id: string  // UUID string
    name: string
    owner_type: OwnerType
    created_at: string
    updated_at: string
  }
  
  export interface OwnerCreate {
    name: string
    owner_type: OwnerType
  }
  
  export interface OwnerUpdate {
    name?: string
    owner_type?: OwnerType
  }
  
  // ─────────────────────────────────────────────
  // 資産 (Asset) のレスポンス型
  // ─────────────────────────────────────────────
  
  export interface Asset {
    id: string  // UUID string
    symbol?: string  // ティッカーは任意
    name: string
    asset_class: AssetClass  // 必須
    asset_type?: AssetType
    region?: Region
    sub_category?: string
    currency: string
    exchange?: string
    isin?: string
  }
  
  // ─────────────────────────────────────────────
  // 新規作成用 (POST /api/assets)
  // ─────────────────────────────────────────────
  
  export interface AssetCreate {
    symbol?: string  // ティッカーは任意
    name: string
    asset_class: AssetClass  // 必須
    asset_type?: AssetType
    region?: Region
    sub_category?: string
    currency: string
    exchange?: string
    isin?: string
  }
  
  // ─────────────────────────────────────────────
  // 更新用 (PUT /api/assets/:id)
  // ─────────────────────────────────────────────
  
  export interface AssetUpdate {
    symbol?: string
    name?: string
    asset_class?: AssetClass
    asset_type?: AssetType
    region?: Region
    sub_category?: string
    currency?: string
    exchange?: string
    isin?: string
  }
  
  export type AccountType =
  | "NISA_growth"
  | "NISA_reserve"
  | "iDeCo"
  | "DC"
  | "specific"
  | "general"
  
  // ─────────────────────────────────────────────
  // 保有資産管理（名義人管理システム対応）
  // ─────────────────────────────────────────────
  
  export interface HoldingForm {
    asset_id: string  // UUID string
    owner_id: string  // UUID string - 名義人管理
    quantity: string  // フォーム用なのでstring
    cost_total: string  // フォーム用なのでstring
    acquisition_date: string
    account_type: AccountType
    broker: string
    notes: string
  }
  
  export interface Holding {
    id: string  // UUID string
    asset: Asset
    owner: Owner  // 名義人情報（リレーションシップ）
    quantity: number
    cost_total: number
    acquisition_date: string
    account_type: AccountType
    broker?: string
    notes?: string
    cost_per_unit: number
  }
  
  export interface HoldingCreate {
    asset_id: string  // UUID string
    owner_id: string  // UUID string - 名義人管理
    quantity: number
    cost_total: number
    acquisition_date: string
    account_type: AccountType
    broker?: string
    notes?: string
  }
  
  export interface HoldingUpdate {
    asset_id?: string
    owner_id?: string
    quantity?: number
    cost_total?: number
    acquisition_date?: string
    account_type?: AccountType
    broker?: string
    notes?: string
  }
  
  export interface Price {
    id: string  // UUID string
    asset_id: string  // UUID string
    date: string
    price: number
    open?: number
    high?: number
    low?: number
    volume?: number
    source?: string
  }
  
  export interface BTCTrade {
    id: string  // UUID string
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