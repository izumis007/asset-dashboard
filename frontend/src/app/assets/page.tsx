'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Plus } from 'lucide-react'

// 型定義（実際のファイルからインポート）
type AssetClass = 'CashEquivalents' | 'FixedIncome' | 'Equity' | 'RealEstate' | 'Commodity' | 'Crypto'
type AssetType = 'Savings' | 'MMF' | 'Stablecoin' | 'GovernmentBond' | 'CorporateBond' | 'BondETF' | 'BondMutualFund' | 'DirectStock' | 'EquityETF' | 'MutualFund' | 'ADR' | 'REIT' | 'GoldETF' | 'CommodityETF' | 'PhysicalGold' | 'Crypto' | 'CryptoETF'

const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  CashEquivalents: '現金等価物',
  FixedIncome: '債券・固定収益',
  Equity: '株式',
  RealEstate: '不動産',
  Commodity: 'コモディティ',
  Crypto: '暗号資産'
}

const ASSET_TYPE_OPTIONS: Record<AssetClass, { value: AssetType; label: string }[]> = {
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
  RealEstate: [{ value: 'REIT', label: 'REIT' }],
  Commodity: [
    { value: 'GoldETF', label: '金ETF' },
    { value: 'CommodityETF', label: 'コモディティETF' },
    { value: 'PhysicalGold', label: '現物金' }
  ],
  Crypto: [
    { value: 'Crypto', label: '暗号資産' },
    { value: 'CryptoETF', label: '暗号資産ETF' }
  ]
}

const DEFAULT_CURRENCY_BY_CLASS: Record<AssetClass, string> = {
  CashEquivalents: 'JPY',
  FixedIncome: 'JPY',
  Equity: 'USD',
  RealEstate: 'JPY',
  Commodity: 'USD',
  Crypto: 'BTC'
}

const REGION_OPTIONS = [
  { value: 'JP', label: '日本' },
  { value: 'US', label: '米国' },
  { value: 'EU', label: '欧州' },
  { value: 'EM', label: '新興国' },
  { value: 'GL', label: '全世界' }
]

interface Asset {
  id: number
  symbol: string
  name: string
  asset_class: string
  asset_type: string
  region?: string
  sub_category?: string
  currency: string
  exchange?: string
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // フォーム状態
  const [symbol, setSymbol] = useState('')
  const [name, setName] = useState('')
  const [assetClass, setAssetClass] = useState<AssetClass>('Equity')
  const [assetType, setAssetType] = useState<AssetType | ''>('')
  const [currency, setCurrency] = useState('USD')
  const [region, setRegion] = useState('')
  const [subCategory, setSubCategory] = useState('')
  const [exchange, setExchange] = useState('')
  const [isin, setIsin] = useState('')

  // 資産クラス変更時の処理
  const handleAssetClassChange = (newClass: AssetClass) => {
    setAssetClass(newClass)
    setAssetType('') // リセット
    setCurrency(DEFAULT_CURRENCY_BY_CLASS[newClass]) // デフォルト通貨設定
  }

  // モックデータ
  useEffect(() => {
    setAssets([
      { id: 1, symbol: 'AAPL', name: 'Apple Inc.', asset_class: 'Equity', asset_type: 'DirectStock', region: 'US', sub_category: '大型テック', currency: 'USD', exchange: 'NASDAQ' },
      { id: 2, symbol: 'VOO', name: 'Vanguard S&P 500 ETF', asset_class: 'Equity', asset_type: 'EquityETF', region: 'US', sub_category: 'インデックス', currency: 'USD', exchange: 'NYSE' },
      { id: 3, symbol: 'BTC', name: 'Bitcoin', asset_class: 'Crypto', asset_type: 'Crypto', sub_category: 'メジャー暗号資産', currency: 'BTC' }
    ])
  }, [])

  const handleSubmit = () => {
    // 実際のAPI呼び出し処理
    console.log('Submitting:', { symbol, name, assetClass, assetType, currency, region, subCategory, exchange, isin })
    setIsFormOpen(false)
    // フォームリセット
    setSymbol('')
    setName('')
    setAssetClass('Equity')
    setAssetType('')
    setCurrency('USD')
    setRegion('')
    setSubCategory('')
    setExchange('')
    setIsin('')
  }

  const filteredAssets = assets.filter(asset =>
    asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">資産管理</h1>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          資産を追加
        </Button>
      </div>

      {/* 検索バー */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="ティッカーシンボルまたは名前で検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 資産登録フォーム */}
      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>新しい資産を登録</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* 基本情報セクション */}
              <div className="bg-muted/20 p-4 rounded-lg space-y-4">
                <h3 className="text-lg font-semibold text-primary">基本情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="symbol">ティッカーシンボル *</Label>
                    <Input
                      id="symbol"
                      placeholder="例: AAPL, BTC"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">資産名 *</Label>
                    <Input
                      id="name"
                      placeholder="例: Apple Inc."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* 分類情報セクション */}
              <div className="bg-muted/20 p-4 rounded-lg space-y-4">
                <h3 className="text-lg font-semibold text-primary">分類情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="assetClass">資産クラス *</Label>
                    <select
                      id="assetClass"
                      value={assetClass}
                      onChange={(e) => handleAssetClassChange(e.target.value as AssetClass)}
                      className="w-full p-2 border border-input rounded-md bg-background"
                    >
                      {Object.entries(ASSET_CLASS_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="assetType">資産タイプ</Label>
                    <select
                      id="assetType"
                      value={assetType}
                      onChange={(e) => setAssetType(e.target.value as AssetType)}
                      className="w-full p-2 border border-input rounded-md bg-background"
                    >
                      <option value="">選択してください</option>
                      {ASSET_TYPE_OPTIONS[assetClass]?.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="currency">通貨</Label>
                    <select
                      id="currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full p-2 border border-input rounded-md bg-background"
                    >
                      <option value="JPY">JPY (日本円)</option>
                      <option value="USD">USD (米ドル)</option>
                      <option value="EUR">EUR (ユーロ)</option>
                      <option value="GBP">GBP (英ポンド)</option>
                      <option value="BTC">BTC (ビットコイン)</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="region">地域</Label>
                    <select
                      id="region"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full p-2 border border-input rounded-md bg-background"
                    >
                      <option value="">選択してください</option>
                      {REGION_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* サブカテゴリ（自由記載）- 2列で配置 */}
                <div>
                  <Label htmlFor="subCategory">サブカテゴリ（自由記載）</Label>
                  <Input
                    id="subCategory"
                    placeholder="例: 大型グロース、高配当、テクノロジー"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    独自の分類や特徴を自由に記載できます
                  </p>
                </div>
              </div>

              {/* 詳細情報セクション */}
              <div className="bg-muted/20 p-4 rounded-lg space-y-4">
                <h3 className="text-lg font-semibold text-primary">詳細情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="exchange">取引所</Label>
                    <Input
                      id="exchange"
                      placeholder="例: NASDAQ, NYSE"
                      value={exchange}
                      onChange={(e) => setExchange(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="isin">ISINコード</Label>
                    <Input
                      id="isin"
                      placeholder="例: US0378331005"
                      value={isin}
                      onChange={(e) => setIsin(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>
              </div>

              {/* ボタン */}
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleSubmit}>登録</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 資産一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>登録済み資産 ({filteredAssets.length}件)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-semibold">ティッカー</th>
                  <th className="text-left p-2 font-semibold">名称</th>
                  <th className="text-left p-2 font-semibold">資産クラス</th>
                  <th className="text-left p-2 font-semibold">タイプ</th>
                  <th className="text-left p-2 font-semibold">サブカテゴリ</th>
                  <th className="text-left p-2 font-semibold">地域</th>
                  <th className="text-left p-2 font-semibold">通貨</th>
                  <th className="text-left p-2 font-semibold">取引所</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-mono font-semibold">{asset.symbol}</td>
                    <td className="p-2">{asset.name}</td>
                    <td className="p-2">
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                        {ASSET_CLASS_LABELS[asset.asset_class as AssetClass]}
                      </span>
                    </td>
                    <td className="p-2">{asset.asset_type}</td>
                    <td className="p-2">
                      <span className="text-xs text-muted-foreground">
                        {asset.sub_category || '-'}
                      </span>
                    </td>
                    <td className="p-2">{asset.region || '-'}</td>
                    <td className="p-2 font-mono">{asset.currency}</td>
                    <td className="p-2">{asset.exchange || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}