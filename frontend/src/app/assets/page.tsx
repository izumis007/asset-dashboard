'use client'

import { useEffect, useState } from 'react'
import { assetsAPI, useAuthStore } from '@/lib/api'
import { Asset, AssetCreate, AssetClass, AssetType, Region } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

// 選択肢の定義
const ASSET_CLASS_OPTIONS = [
  { value: 'CashEq', label: '現金等価物' },
  { value: 'FixedIncome', label: '債券' },
  { value: 'Equity', label: '株式' },
  { value: 'RealAsset', label: '実物資産' },
  { value: 'Crypto', label: '暗号資産' }
] as const

const ASSET_TYPE_OPTIONS = [
  { value: 'Savings', label: '預貯金' },
  { value: 'MMF', label: 'MMF' },
  { value: 'Stablecoin', label: 'ステーブルコイン' },
  { value: 'GovBond', label: '国債' },
  { value: 'CorpBond', label: '社債' },
  { value: 'BondETF', label: '債券ETF' },
  { value: 'DirectStock', label: '個別株' },
  { value: 'EquityETF', label: '株式ETF' },
  { value: 'MutualFund', label: '投資信託' },
  { value: 'REIT', label: 'REIT' },
  { value: 'Commodity', label: 'コモディティ' },
  { value: 'GoldETF', label: '金ETF' },
  { value: 'Crypto', label: '暗号資産' }
] as const

const REGION_OPTIONS = [
  { value: 'JP', label: '日本' },
  { value: 'US', label: '米国' },
  { value: 'EU', label: '欧州' },
  { value: 'EM', label: '新興国' },
  { value: 'GL', label: '全世界' }
] as const

const CURRENCY_OPTIONS = [
  { value: 'JPY', label: '日本円 (JPY)' },
  { value: 'USD', label: '米ドル (USD)' },
  { value: 'EUR', label: 'ユーロ (EUR)' },
  { value: 'BTC', label: 'ビットコイン (BTC)' },
  { value: 'ETH', label: 'イーサリアム (ETH)' }
] as const

// フォームの型定義
interface AssetForm {
  symbol: string
  name: string
  asset_class: AssetClass
  asset_type: AssetType | ''
  region: Region | ''
  currency: string
  exchange: string
  isin: string
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  // フォームの状態
  const [form, setForm] = useState<AssetForm>({
    symbol: '',
    name: '',
    asset_class: 'Equity',
    asset_type: '',
    region: '',
    currency: 'JPY',
    exchange: '',
    isin: ''
  })

  // 認証チェック
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    const fetchAssets = async () => {
      try {
        setIsLoading(true)
        const res = await assetsAPI.list()
        setAssets(res)
      } catch (error) {
        console.error('資産一覧の取得に失敗:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAssets()
  }, [isAuthenticated, router])

  const handleInputChange = (field: keyof AssetForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.symbol || !form.name) {
      alert('ティッカーと名称は必須です')
      return
    }

    setIsSubmitting(true)
    
    try {
      const assetData: AssetCreate = {
        symbol: form.symbol,
        name: form.name,
        asset_class: form.asset_class,
        asset_type: form.asset_type === '' ? undefined : form.asset_type as AssetType,
        region: form.region === '' ? undefined : form.region as Region,
        currency: form.currency,
        exchange: form.exchange || undefined,
        isin: form.isin || undefined
      }

      await assetsAPI.create(assetData)
      
      // フォームをリセット
      setForm({
        symbol: '',
        name: '',
        asset_class: 'Equity',
        asset_type: '',
        region: '',
        currency: 'JPY',
        exchange: '',
        isin: ''
      })

      // 資産一覧を再取得
      const updatedAssets = await assetsAPI.list()
      setAssets(updatedAssets)

      alert('資産を登録しました')
    } catch (error: any) {
      console.error('資産登録エラー:', error)
      if (error.response?.status === 400) {
        alert('入力内容に問題があります: ' + (error.response.data?.detail || '不明なエラー'))
      } else {
        alert('資産の登録に失敗しました')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // 認証されていない場合は何も表示しない
  if (!isAuthenticated()) {
    return null
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">資産管理</h1>

      {/* 資産登録フォーム */}
      <Card>
        <CardHeader>
          <CardTitle>新しい資産を登録</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 必須項目 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  ティッカー/コード <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.symbol}
                  onChange={(e) => handleInputChange('symbol', e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="例: BTC, AAPL, 1306"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="例: ビットコイン, Apple Inc."
                  required
                />
              </div>
            </div>

            {/* 分類項目 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  アセットクラス <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.asset_class}
                  onChange={(e) => handleInputChange('asset_class', e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  {ASSET_CLASS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  資産タイプ（任意）
                </label>
                <select
                  value={form.asset_type}
                  onChange={(e) => handleInputChange('asset_type', e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">選択してください</option>
                  {ASSET_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  地域（任意）
                </label>
                <select
                  value={form.region}
                  onChange={(e) => handleInputChange('region', e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">選択してください</option>
                  {REGION_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* その他の項目 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  通貨
                </label>
                <select
                  value={form.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {CURRENCY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  取引所（任意）
                </label>
                <input
                  type="text"
                  value={form.exchange}
                  onChange={(e) => handleInputChange('exchange', e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="例: NASDAQ, TSE"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  ISINコード（任意）
                </label>
                <input
                  type="text"
                  value={form.isin}
                  onChange={(e) => handleInputChange('isin', e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="例: US0378331005"
                />
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
              {isSubmitting ? '登録中...' : '資産を登録'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 登録済み資産一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>登録済みの資産</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">読み込み中...</div>
          ) : assets.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              まだ資産が登録されていません
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">ティッカー</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">名称</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">アセットクラス</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">資産タイプ</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">地域</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">通貨</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">取引所</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-mono">
                        {asset.symbol}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {asset.name}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {ASSET_CLASS_OPTIONS.find(opt => opt.value === asset.asset_class)?.label || asset.asset_class || '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {ASSET_TYPE_OPTIONS.find(opt => opt.value === asset.asset_type)?.label || asset.asset_type || '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {REGION_OPTIONS.find(opt => opt.value === asset.region)?.label || asset.region || '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {asset.currency}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {asset.exchange || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}