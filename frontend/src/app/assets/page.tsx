'use client'

import { useEffect, useState } from 'react'
import { assetsAPI } from '@/lib/api'
import { Asset, AssetCreate, AssetClass, AssetType, Region } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlusIcon, EditIcon, TrashIcon } from 'lucide-react'

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // フォーム状態
  const [symbol, setSymbol] = useState('')
  const [name, setName] = useState('')
  const [assetClass, setAssetClass] = useState<AssetClass>('EQUITY')
  const [assetType, setAssetType] = useState<AssetType | undefined>(undefined)
  const [region, setRegion] = useState<Region | undefined>(undefined)
  const [subCategory, setSubCategory] = useState<string>('')
  const [currency, setCurrency] = useState('JPY')
  const [exchange, setExchange] = useState('')
  const [isin, setIsin] = useState('')

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setIsLoading(true)
        const res = await assetsAPI.list()
        setAssets(res)
      } catch (error) {
        console.error('Failed to fetch assets:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAssets()
  }, [])

  const resetForm = () => {
    setSymbol('')
    setName('')
    setAssetClass('EQUITY')
    setAssetType(undefined)
    setRegion(undefined)
    setSubCategory('')
    setCurrency('JPY')
    setExchange('')
    setIsin('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!symbol.trim() || !name.trim()) {
      alert('ティッカーと名称は必須です')
      return
    }

    setIsSubmitting(true)
    
    const newAsset: AssetCreate = {
      symbol: symbol.trim(),
      name: name.trim(),
      asset_class: assetClass,
      ...(assetType && { asset_type: assetType }),
      ...(region && { region }),
      ...(subCategory && subCategory.trim() && { sub_category: subCategory.trim() }),
      currency,
      ...(exchange && exchange.trim() && { exchange: exchange.trim() }),
      ...(isin && isin.trim() && { isin: isin.trim() }),
    }
  
    try {
      await assetsAPI.create(newAsset)
      const res = await assetsAPI.list()
      setAssets(res)
      resetForm()
    } catch (error) {
      console.error("Asset creation failed:", error)
      alert('資産の登録に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('この資産を削除しますか？')) return
    
    try {
      await assetsAPI.delete(id)
      setAssets(assets.filter(asset => asset.id !== id))
    } catch (error) {
      console.error('Failed to delete asset:', error)
      alert('削除に失敗しました')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">資産管理</h1>
          <p className="text-muted-foreground mt-2">
            株式、ETF、投資信託、暗号資産などの資産を登録・管理します
          </p>
        </div>
      </div>

      {/* 登録フォーム */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusIcon className="h-5 w-5" />
            新しい資産を登録
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* ティッカー */}
              <div className="space-y-2">
                <Label htmlFor="symbol">ティッカー *</Label>
                <Input
                  id="symbol"
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="例: BTC, TSLA, 1306"
                  required
                />
              </div>

              {/* 名称 */}
              <div className="space-y-2">
                <Label htmlFor="name">名称 *</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例: ビットコイン, テスラ"
                  required
                />
              </div>

              {/* 通貨 */}
              <div className="space-y-2">
                <Label htmlFor="currency">通貨</Label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="JPY">JPY</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                </select>
              </div>

              {/* 資産クラス */}
              <div className="space-y-2">
                <Label htmlFor="assetClass">資産クラス</Label>
                <select
                  id="assetClass"
                  value={assetClass}
                  onChange={(e) => setAssetClass(e.target.value as AssetClass)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="CASHEQ">現金等価物</option>
                  <option value="FIXED_INCOME">債券</option>
                  <option value="EQUITY">株式</option>
                  <option value="REAL_ASSET">実物資産</option>
                  <option value="CRYPTO">暗号資産</option>
                </select>
              </div>

              {/* 資産タイプ */}
              <div className="space-y-2">
                <Label htmlFor="assetType">資産タイプ</Label>
                <select
                  id="assetType"
                  value={assetType || ''}
                  onChange={(e) => setAssetType(e.target.value as AssetType || undefined)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">選択してください</option>
                  <option value="SAVINGS">普通預金</option>
                  <option value="MMF">MMF</option>
                  <option value="STABLECOIN">ステーブルコイン</option>
                  <option value="GOV_BOND">国債</option>
                  <option value="CORP_BOND">社債</option>
                  <option value="BOND_ETF">債券ETF</option>
                  <option value="DIRECT_STOCK">個別株</option>
                  <option value="EQUITY_ETF">株式ETF</option>
                  <option value="MUTUAL_FUND">投資信託</option>
                  <option value="REIT">REIT</option>
                  <option value="COMMODITY">コモディティ</option>
                  <option value="GOLD_ETF">金ETF</option>
                  <option value="CRYPTO">暗号資産</option>
                </select>
              </div>

              {/* 地域 */}
              <div className="space-y-2">
                <Label htmlFor="region">地域</Label>
                <select
                  id="region"
                  value={region || ''}
                  onChange={(e) => setRegion(e.target.value as Region || undefined)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">選択してください</option>
                  <option value="US">アメリカ</option>
                  <option value="JP">日本</option>
                  <option value="EU">ヨーロッパ</option>
                  <option value="EM">新興国</option>
                  <option value="GL">グローバル</option>
                  <option value="DM">先進国</option>
                </select>
              </div>

              {/* 取引所 */}
              <div className="space-y-2">
                <Label htmlFor="exchange">取引所</Label>
                <Input
                  id="exchange"
                  type="text"
                  value={exchange}
                  onChange={(e) => setExchange(e.target.value)}
                  placeholder="例: NYSE, TSE"
                />
              </div>
            </div>

            {/* ISINコード */}
            <div className="space-y-2">
              <Label htmlFor="isin">ISINコード</Label>
              <Input
                id="isin"
                type="text"
                value={isin}
                onChange={(e) => setIsin(e.target.value)}
                placeholder="例: US88160R1014"
                className="max-w-md"
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  登録中...
                </>
              ) : (
                <>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  資産を登録
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 登録済み資産一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>登録済みの資産 ({assets.length}件)</CardTitle>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              まだ資産が登録されていません
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        ティッカー
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        名称
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        資産クラス
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        資産タイプ
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        地域
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        通貨
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        取引所
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((asset, index) => (
                      <tr
                        key={asset.id}
                        className={`border-b transition-colors hover:bg-muted/50 ${
                          index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                        }`}
                      >
                        <td className="h-12 px-4 align-middle">
                          <div className="font-mono font-medium text-foreground">
                            {asset.symbol}
                          </div>
                        </td>
                        <td className="h-12 px-4 align-middle">
                          <div className="font-medium text-foreground max-w-[200px] truncate">
                            {asset.name}
                          </div>
                        </td>
                        <td className="h-12 px-4 align-middle">
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/20">
                            {asset.asset_class || '-'}
                          </span>
                        </td>
                        <td className="h-12 px-4 align-middle">
                          <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700/10 dark:bg-green-400/10 dark:text-green-400 dark:ring-green-400/20">
                            {asset.asset_type || '-'}
                          </span>
                        </td>
                        <td className="h-12 px-4 align-middle text-muted-foreground">
                          {asset.region || '-'}
                        </td>
                        <td className="h-12 px-4 align-middle">
                          <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-600/20 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20">
                            {asset.currency}
                          </span>
                        </td>
                        <td className="h-12 px-4 align-middle text-muted-foreground">
                          {asset.exchange || '-'}
                        </td>
                        <td className="h-12 px-4 align-middle">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(asset.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}