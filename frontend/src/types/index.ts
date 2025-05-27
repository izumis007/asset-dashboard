export interface Asset {
    id: number
    symbol: string
    name: string
    category: 'equity' | 'etf' | 'fund' | 'bond' | 'crypto' | 'cash'
    sub_category?: string
    currency: string
    exchange?: string
    isin?: string
  }
  
  export interface AssetCreate {
    symbol: string
    name: string
    category: Asset['category']
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
  
  export interface Holding {
    id: number
    asset: Asset
    quantity: number
    cost_total: number
    acquisition_date: string
    account_type: 'NISA' | 'iDeCo' | 'taxable'
    broker?: string
    notes?: string
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

  // src/types/index.ts

export interface User {
  id: string
  username: string
  email: string
  totp_enabled: boolean
}

export interface Asset {
  id: number
  symbol: string
  name: string
  category: 'equity' | 'etf' | 'fund' | 'bond' | 'crypto' | 'cash'
  currency: string
  exchange?: string
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
