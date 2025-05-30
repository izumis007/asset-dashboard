'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Plus } from 'lucide-react'
import { api, useAuthStore } from '@/lib/api'
import type { Asset, AssetCreate, AssetClass, AssetType, Region } from '@/types'

// ✅ 直接API型を使用（ローカル型は廃止）
type LocalAssetClass = AssetClass  // ← API型をそのまま使用

// ✅ 簡素化されたラベル定義
const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  'CashEq': '現金等価物',
  'FixedIncome': '債券・固定収益', 
  'Equity': '株式',
  'RealAsset': '実物資産',  // ← 不動産とコモディティを統合
  'Crypto': '暗号資産'
}

// ✅ マッピング関数を削除（不要になった）
// const mapLocalToApiClass = ... ← 削除

const DEFAULT_CURRENCY_BY_CLASS: Record<AssetClass, string> = {
  'CashEq': 'JPY',
  'FixedIncome': 'JPY',
  'Equity': 'USD', 
  'RealAsset': 'USD',
  'Crypto': 'BTC'
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)

  
  // ✅ フォーム状態 - 直接API型を使用
  const [symbol, setSymbol] = useState('')
  const [name, setName] = useState('')
  const [assetClass, setAssetClass] = useState<AssetClass>('Equity')  // ← API型を直接使用
  const [currency, setCurrency] = useState('USD')
  const [region, setRegion] = useState('')
  const [subCategory, setSubCategory] = useState('')
  const [exchange, setExchange] = useState('')
  const [isin, setIsin] = useState('')

  // ✅ fetchAssets - 変更なし
  const fetchAssets = async (): Promise<Asset[]> => {
    try {
      console.log('🔍 Fetching assets via axios...')
      const response = await api.get('/api/assets/')
      console.log('✅ Assets fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Fetch error:', error)
      throw error
    }
  }

  // ✅ createAsset - 型変換不要
  const createAsset = async (assetData: {
    symbol: string
    name: string
    asset_class: AssetClass  // ← 直接API型を使用
    region?: string
    sub_category?: string
    currency: string
    exchange?: string
    isin?: string
  }) => {
    try {
      console.log('🚀 Creating asset via axios...')
      
      // ✅ 型変換不要 - そのまま送信
      const apiAssetData: AssetCreate = {
        symbol: assetData.symbol,
        name: assetData.name,
        asset_class: assetData.asset_class,  // ← そのまま使用
        currency: assetData.currency,
        exchange: assetData.exchange,
        isin: assetData.isin
      }

      const response = await api.post('/api/assets/', apiAssetData)
      console.log('✅ Asset created:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Create error:', error)
      throw error
    }
  }

  // ✅ 初期データ取得
  useEffect(() => {
    const loadAssets = async () => {
      try {
        if (!isAuthenticated()) {
          alert('ログインが必要です')
          window.location.href = '/login'
          return
        }

        const loadedAssets = await fetchAssets()
        setAssets(loadedAssets)
        console.log('Assets loaded successfully:', loadedAssets.length, 'items')
      } catch (error) {
        console.error('Failed to load assets:', error)
        setAssets([])
        alert('資産データの読み込みに失敗しました')
      }
    }

    loadAssets()
  }, [])

  // ✅ 資産クラス変更時の処理
  const handleAssetClassChange = (newClass: AssetClass) => {
    setAssetClass(newClass)
    setCurrency(DEFAULT_CURRENCY_BY_CLASS[newClass])
  }

  const handleSubmit = async () => {
    try {
      if (!symbol.trim() || !name.trim()) {
        alert('ティッカーシンボルと資産名は必須です')
        return
      }

      const assetData = {
        symbol: symbol.trim(),
        name: name.trim(),
        asset_class: assetClass,  // ← 型変換不要
        region: region || undefined,
        sub_category: subCategory.trim() || undefined,
        currency,
        exchange: exchange.trim() || undefined,
        isin: isin.trim() || undefined
      }

      const newAsset = await createAsset(assetData)
      const updatedAssets = await fetchAssets()
      setAssets(updatedAssets)

      setIsFormOpen(false)
      resetForm()
      alert(`${newAsset.symbol} - ${newAsset.name} を登録しました`)

    } catch (error) {
      console.error('Asset creation failed:', error)
      alert('資産の登録に失敗しました')
    }
  }

  const resetForm = () => {
    setSymbol('')
    setName('')
    setAssetClass('Equity')
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
        <Button onClick={() => {
          setIsFormOpen(true)
          resetForm()
        }}>
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

      {/* 簡素化されたフォーム */}
      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>新しい資産を登録</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsFormOpen(false)
                    resetForm()
                  }}
                >
                  キャンセル
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!symbol.trim() || !name.trim()}
                >
                  登録
                </Button>
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
                  <th className="text-left p-2 font-semibold">通貨</th>
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
                    <td className="p-2 font-mono">{asset.currency}</td>
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