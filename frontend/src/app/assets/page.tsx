'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Edit, Trash2, TrendingUp, Globe, Building } from 'lucide-react'

// Mock data - 実際は API から取得
const mockAssets = [
  {
    id: 1,
    symbol: 'AAPL',
    name: 'Apple Inc.',
    asset_class: 'Equity',
    asset_type: 'DirectStock',
    region: 'US',
    currency: 'USD',
    exchange: 'NASDAQ',
    isin: 'US0378331005'
  },
  {
    id: 2,
    symbol: 'BTC',
    name: 'Bitcoin',
    asset_class: 'Crypto',
    asset_type: 'Crypto',
    region: 'GL',
    currency: 'BTC',
    exchange: null,
    isin: null
  },
  {
    id: 3,
    symbol: '1306',
    name: 'TOPIX連動型上場投資信託',
    asset_class: 'Equity',
    asset_type: 'EquityETF',
    region: 'JP',
    currency: 'JPY',
    exchange: 'TSE',
    isin: 'JP1311140006'
  }
]

const assetClassOptions = [
  { value: 'CashEq', label: '現金等価物', icon: '💰' },
  { value: 'FixedIncome', label: '債券', icon: '📈' },
  { value: 'Equity', label: '株式', icon: '📊' },
  { value: 'RealAsset', label: '実物資産', icon: '🏠' },
  { value: 'Crypto', label: '暗号資産', icon: '₿' }
]

const regionOptions = [
  { value: 'JP', label: '日本', flag: '🇯🇵' },
  { value: 'US', label: '米国', flag: '🇺🇸' },
  { value: 'EU', label: '欧州', flag: '🇪🇺' },
  { value: 'EM', label: '新興国', flag: '🌏' },
  { value: 'GL', label: '世界', flag: '🌍' }
]

// 型定義を追加
interface Asset {
  id: number
  symbol: string
  name: string
  asset_class: string
  asset_type?: string
  region: string
  currency: string
  exchange?: string | null
  isin?: string | null
}

interface FormData {
  symbol: string
  name: string
  asset_class: string
  asset_type: string
  region: string
  currency: string
  exchange: string
  isin: string
}

export default function EnhancedAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>(mockAssets)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  
  // フォーム状態
  const [formData, setFormData] = useState<FormData>({
    symbol: '',
    name: '',
    asset_class: 'Equity',
    asset_type: '',
    region: 'JP',
    currency: 'JPY',
    exchange: '',
    isin: ''
  })

  // フィルタされた資産
  const filteredAssets = assets.filter(asset =>
    asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = () => {
    if (editingAsset) {
      // 編集処理
      setAssets(assets.map(asset => 
        asset.id === editingAsset.id ? { ...formData, id: editingAsset.id } : asset
      ))
      setEditingAsset(null)
    } else {
      // 新規追加
      const newAsset = { ...formData, id: Date.now() }
      setAssets([...assets, newAsset])
    }
    
    // フォームリセット
    setFormData({
      symbol: '',
      name: '',
      asset_class: 'Equity',
      asset_type: '',
      region: 'JP',
      currency: 'JPY',
      exchange: '',
      isin: ''
    })
    setShowAddForm(false)
  }

  const handleEdit = (asset: Asset) => {
    setFormData({
      symbol: asset.symbol,
      name: asset.name,
      asset_class: asset.asset_class,
      asset_type: asset.asset_type || '',
      region: asset.region,
      currency: asset.currency,
      exchange: asset.exchange || '',
      isin: asset.isin || ''
    })
    setEditingAsset(asset)
    setShowAddForm(true)
  }

  const handleDelete = (id: number) => {
    if (confirm('この資産を削除しますか？')) {
      setAssets(assets.filter(asset => asset.id !== id))
    }
  }

  const getAssetClassInfo = (assetClass: string) => {
    return assetClassOptions.find(opt => opt.value === assetClass) || { label: assetClass, icon: '📄' }
  }

  const getRegionInfo = (region: string) => {
    return regionOptions.find(opt => opt.value === region) || { label: region, flag: '🏳️' }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">資産管理</h1>
          <p className="text-muted-foreground">投資対象資産の登録・管理</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          新規資産追加
        </Button>
      </div>

      {/* 検索バー */}
      <Card>
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="資産名またはティッカーで検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* 資産一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssets.map((asset) => {
          const classInfo = getAssetClassInfo(asset.asset_class)
          const regionInfo = getRegionInfo(asset.region)
          
          return (
            <Card key={asset.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{classInfo.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{asset.symbol}</CardTitle>
                      <p className="text-sm text-muted-foreground">{asset.name}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(asset)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(asset.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {classInfo.icon} {classInfo.label}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {regionInfo.flag} {regionInfo.label}
                    </span>
                    <span className="font-mono">{asset.currency}</span>
                  </div>
                  {asset.exchange && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Building className="h-3 w-3" />
                      {asset.exchange}
                    </div>
                  )}
                  {asset.isin && (
                    <div className="text-xs text-muted-foreground font-mono">
                      ISIN: {asset.isin}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 追加/編集フォーム */}
      {showAddForm && (
        <Card className="fixed inset-0 z-50 m-4 overflow-auto bg-background">
          <CardHeader>
            <CardTitle>
              {editingAsset ? '資産情報編集' : '新規資産追加'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="symbol">ティッカーシンボル *</Label>
                  <Input
                    id="symbol"
                    value={formData.symbol}
                    onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                    placeholder="例: AAPL, BTC, 1306"
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="name">資産名 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="例: Apple Inc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="asset_class">資産クラス *</Label>
                  <select
                    id="asset_class"
                    value={formData.asset_class}
                    onChange={(e) => setFormData({...formData, asset_class: e.target.value})}
                    className="w-full p-2 rounded border"
                  >
                    {assetClassOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.icon} {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="region">地域</Label>
                  <select
                    id="region"
                    value={formData.region}
                    onChange={(e) => setFormData({...formData, region: e.target.value})}
                    className="w-full p-2 rounded border"
                  >
                    {regionOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.flag} {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="currency">通貨 *</Label>
                  <select
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => setFormData({...formData, currency: e.target.value})}
                    className="w-full p-2 rounded border font-mono"
                  >
                    <option value="JPY">JPY</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="BTC">BTC</option>
                    <option value="ETH">ETH</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="exchange">取引所</Label>
                  <Input
                    id="exchange"
                    value={formData.exchange}
                    onChange={(e) => setFormData({...formData, exchange: e.target.value})}
                    placeholder="例: NASDAQ, TSE"
                  />
                </div>
                <div>
                  <Label htmlFor="isin">ISINコード</Label>
                  <Input
                    id="isin"
                    value={formData.isin}
                    onChange={(e) => setFormData({...formData, isin: e.target.value})}
                    placeholder="例: US0378331005"
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingAsset(null)
                  }}
                >
                  キャンセル
                </Button>
                <Button onClick={handleSubmit}>
                  {editingAsset ? '更新' : '追加'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredAssets.length === 0 && searchTerm && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              「{searchTerm}」に一致する資産が見つかりませんでした
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}