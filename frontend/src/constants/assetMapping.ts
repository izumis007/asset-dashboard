import type { AssetClass, AssetType } from '@/types'

export const ASSET_TYPE_BY_CLASS: Record<AssetClass, AssetType[]> = {
  CashEq: ['Savings', 'MMF', 'Stablecoin'],
  FixedIncome: ['GovBond', 'CorpBond', 'BondETF'],
  Equity: ['DirectStock', 'EquityETF', 'MutualFund', 'REIT'],
  RealAsset: ['Commodity', 'GoldETF'],
  Crypto: ['Crypto'],
} as const;