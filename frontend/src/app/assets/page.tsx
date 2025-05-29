'use client'

import { useEffect, useState } from 'react'
import { assetsAPI } from '@/lib/api'
import { Asset, AssetCreate, AssetClass, AssetType, Region } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [isFormVisible, setIsFormVisible] = useState(false)

  // フォームの状態
  const [symbol, setSymbol] = useState('')
  const [name, setName] = useState('')
  const [assetClass, setAssetClass] = useState<AssetClass>('Equity')
  const [assetType, setAssetType] = useState<AssetType | undefined>(undefined)
  const [region, setRegion] = useState<Region | undefined>(undefined)
  const [subCategory, setSubCategory] = useState<string | undefined>(undefined)
  const [currency, setCurrency] = useState('JPY')
  const [exchange, setExchange] = useState('')
  const [isin, setIsin] = useState('')

  useEffect(() => {
    fetchAssets()
  }, [])

  const fetchAssets = async () => {
    try {
      const res = await assetsAPI.list()
      setAssets(res)
    } catch (error) {
      console.error('Failed to fetch assets:', error)
    }
  }

  const resetForm = () => {
    setSymbol('')
    setName('')
    setAssetClass('Equity')
    setAssetType(undefined)
    setRegion(undefined)
    setSubCategory(undefined)
    setCurrency('JPY')
    setExchange('')
    setIsin('')
    setEditingAsset(null)
  }

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset)
    setSymbol(asset.symbol)
    setName(asset.name)
    setAssetClass(asset.asset_class as AssetClass || 'Equity')
    setAssetType(asset.asset_type as AssetType || undefined)
    setRegion(asset.region as Region || undefined)
    setSubCategory(asset.sub_category || undefined)
    setCurrency(asset.currency)
    setExchange(asset.exchange || '')
    setIsin(asset.isin || '')
    setIsFormVisible(true)
  }

  const handleDelete = async (assetId: number) => {
    if (!confirm('この資産を削除しますか？')) return
    
    try {
      await assetsAPI.delete(assetId)
      await fetchAssets()
    } catch (error) {
      console.error('Failed to delete asset:', error)
      alert('削除に失敗しました')
    }
  }

  const handleSubmit = async () => {
    const assetData: AssetCreate = {
      symbol,
      name,
      asset_class: assetClass,
      ...(assetType && { asset_type: assetType }),
      ...(region && { region }),
      ...(subCategory && { sub_category: subCategory }),
      currency,
      ...(exchange && { exchange }),
      ...(isin && { isin }),
    }

    try {
      if (editingAsset) {
        // 編集
        await assetsAPI.update(editingAsset.id, assetData)
      } else {
        // 新規作成
        await assetsAPI.create(assetData)
      }
      
      await fetchAssets()
      resetForm()
      setIsFormVisible(false)
    } catch (error) {
      console.error('Asset operation failed:', error)
      alert(editingAsset ? '更新に失敗しました' : '登録に失敗しました')
    }
  }

  const handleCancel = () => {
    resetForm()
    setIsFormVisible(false)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">資産管理</h1>
        <Button 
          onClick={() => setIsFormVisible(true)}
        >
          新しい資産を追加
        </Button>
      </div>

      {/* 資産登録・編集フォーム */}
      {isFormVisible && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingAsset ? '資産を編集' : '新しい資産を登録'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  ティッカー・シンボル *
                </label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full p-2 border rounded-md text-black"
                  placeholder="例: BTC, TSLA, 1306"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  名称 *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border rounded-md text-black"
                  placeholder="例: ビットコイン, テスラ"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  資産クラス *
                </label>
                <select
                  value={assetClass}
                  onChange={(e) => setAssetClass(e.target.value as AssetClass)}
                  className="w-full p-2 border rounded-md text-black"
                  required
                >
                  <option value="CashEq">現金等価物</option>
                  <option value="FixedIncome">債券</option>
                  <option value="Equity">株式</option>
                  <option value="RealAsset">実物資産</option>
                  <option value="Crypto">暗号資産</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  資産タイプ
                </label>
                <select
                  value={assetType || ''}
                  onChange={(e) => setAssetType(e.target.value as AssetType || undefined)}
                  className="w-full p-2 border rounded-md text-black"
                >
                  <option value="">選択してください</option>
                  <option value="Savings">普通預金</option>
                  <option value="MMF">MMF</option>
                  <option value="Stablecoin">ステーブルコイン</option>
                  <option value="GovBond">国債</option>
                  <option value="CorpBond">社債</option>
                  <option value="BondETF">債券ETF</option>
                  <option value="DirectStock">個別株</option>
                  <option value="EquityETF">株式ETF</option>
                  <option value="MutualFund">投資信託</option>
                  <option value="REIT">REIT</option>
                  <option value="Commodity">コモディティ</option>
                  <option value="GoldETF">金ETF</option>
                  <option value="Crypto">暗号資産</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  地域
                </label>
                <select
                  value={region || ''}
                  onChange={(e) => setRegion(e.target.value as Region || undefined)}
                  className="w-full p-2 border rounded-md text-black"
                >
                  <option value="">選択してください</option>
                  <option value="JP">日本</option>
                  <option value="US">米国</option>
                  <option value="EU">欧州</option>
                  <option value="DM">先進国</option>
                  <option value="EM">新興国</option>
                  <option value="GL">グローバル</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  通貨 *
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full p-2 border rounded-md text-black"
                  required
                >
                  <option value="JPY">JPY</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  取引所
                </label>
                <input
                  type="text"
                  value={exchange}
                  onChange={(e) => setExchange(e.target.value)}
                  className="w-full p-2 border rounded-md text-black"
                  placeholder="例: TSE, NASDAQ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  ISINコード
                </label>
                <input
                  type="text"
                  value={isin}
                  onChange={(e) => setIsin(e.target.value)}
                  className="w-full p-2 border rounded-md text-black"
                  placeholder="例: JP3436100006"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSubmit}
              >
                {editingAsset ? '更新' : '登録'}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
              >
                キャンセル
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 資産一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>登録済みの資産</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2">ティッカー</th>
                  <th className="px-4 py-2">名称</th>
                  <th className="px-4 py-2">資産クラス</th>
                  <th className="px-4 py-2">タイプ</th>
                  <th className="px-4 py-2">地域</th>
                  <th className="px-4 py-2">通貨</th>
                  <th className="px-4 py-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset.id} className="border-b hover:bg-gray-100 dark:hover:bg-gray-800">
                    <td className="px-4 py-2 font-mono">{asset.symbol}</td>
                    <td className="px-4 py-2">{asset.name}</td>
                    <td className="px-4 py-2">{asset.asset_class}</td>
                    <td className="px-4 py-2">{asset.asset_type || '-'}</td>
                    <td className="px-4 py-2">
                      {asset.region === 'DM' ? '先進国' : 
                       asset.region === 'JP' ? '日本' :
                       asset.region === 'US' ? '米国' :
                       asset.region === 'EU' ? '欧州' :
                       asset.region === 'EM' ? '新興国' :
                       asset.region === 'GL' ? 'グローバル' :
                       asset.region || '-'}
                    </td>
                    <td className="px-4 py-2">{asset.currency}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEdit(asset)}
                          variant="outline"
                          size="sm"
                        >
                          編集
                        </Button>
                        <Button
                          onClick={() => handleDelete(asset.id)}
                          variant="destructive"
                          size="sm"
                        >
                          削除
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {assets.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                登録されている資産がありません
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}