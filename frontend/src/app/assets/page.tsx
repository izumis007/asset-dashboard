'use client'

import { useEffect, useState } from 'react'
import { assetsAPI } from '@/lib/api'
import { Asset, AssetCreate, AssetClass, AssetType, Region } from '@/types'

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [enums, setEnums] = useState<any>(null)

  const [symbol, setSymbol] = useState('')
  const [name, setName] = useState('')
  const [assetClass, setAssetClass] = useState<AssetClass>('EQUITY')
  const [assetType, setAssetType] = useState<AssetType | undefined>(undefined)
  const [region, setRegion] = useState<Region | undefined>(undefined)
  const [subCategory, setSubCategory] = useState('')
  const [currency, setCurrency] = useState('JPY')
  const [exchange, setExchange] = useState('')
  const [isin, setIsin] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assetsData, enumsData] = await Promise.all([
          assetsAPI.list(),
          assetsAPI.getEnums()
        ])
        setAssets(assetsData)
        setEnums(enumsData)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      }
    }
    fetchData()
  }, [])

  const handleSubmit = async () => {
    const newAsset: AssetCreate = {
      symbol,
      name,
      asset_class: assetClass,
      asset_type: assetType,
      region: region,
      sub_category: subCategory || undefined,
      currency,
      exchange: exchange || undefined,
      isin: isin || undefined,
    }
  
    try {
      await assetsAPI.create(newAsset)
      const res = await assetsAPI.list()
      setAssets(res)
  
      // 入力フォームのリセット
      setSymbol('')
      setName('')
      setAssetClass('EQUITY')
      setAssetType(undefined)
      setRegion(undefined)
      setSubCategory('')
      setCurrency('JPY')
      setExchange('')
      setIsin('')
    } catch (error) {
      console.error("Asset creation failed:", error)
      alert("資産の登録に失敗しました")
    }
  }

  if (!enums) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">資産の登録</h1>
      <div className="space-y-2 mb-6 max-w-md">
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="w-full p-2 border rounded text-black"
          placeholder="ティッカー（例: BTC, TSLA）"
          required
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded text-black"
          placeholder="名称（例: ビットコイン, テスラ）"
          required
        />
        
        <select
          value={assetClass}
          onChange={(e) => setAssetClass(e.target.value as AssetClass)}
          className="w-full p-2 border rounded text-black"
          required
        >
          {enums.asset_classes?.map((item: any) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <select
          value={assetType || ''}
          onChange={(e) => setAssetType(e.target.value as AssetType || undefined)}
          className="w-full p-2 border rounded text-black"
        >
          <option value="">資産タイプを選択（任意）</option>
          {enums.asset_types?.map((item: any) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <select
          value={region || ''}
          onChange={(e) => setRegion(e.target.value as Region || undefined)}
          className="w-full p-2 border rounded text-black"
        >
          <option value="">地域を選択（任意）</option>
          {enums.regions?.map((item: any) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={subCategory}
          onChange={(e) => setSubCategory(e.target.value)}
          className="w-full p-2 border rounded text-black"
          placeholder="サブカテゴリ（任意、例: 大型株、新興国債券）"
        />

        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="w-full p-2 border rounded text-black"
          required
        >
          <option value="JPY">JPY</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
          <option value="BTC">BTC</option>
          <option value="ETH">ETH</option>
        </select>

        <input
          type="text"
          value={exchange}
          onChange={(e) => setExchange(e.target.value)}
          className="w-full p-2 border rounded text-black"
          placeholder="取引所（任意、例: NASDAQ, TSE）"
        />
        
        <input
          type="text"
          value={isin}
          onChange={(e) => setIsin(e.target.value)}
          className="w-full p-2 border rounded text-black"
          placeholder="ISINコード（任意）"
        />
        
        <button
          onClick={handleSubmit}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          登録
        </button>
      </div>

      <h2 className="text-lg font-semibold mb-2">登録済みの資産</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left table-auto border-collapse border">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-2 py-1 border">ティッカー</th>
              <th className="px-2 py-1 border">名称</th>
              <th className="px-2 py-1 border">資産クラス</th>
              <th className="px-2 py-1 border">資産タイプ</th>
              <th className="px-2 py-1 border">地域</th>
              <th className="px-2 py-1 border">サブカテゴリ</th>
              <th className="px-2 py-1 border">通貨</th>
              <th className="px-2 py-1 border">取引所</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id} className="border-b hover:bg-gray-50">
                <td className="px-2 py-1 border font-mono">{asset.symbol}</td>
                <td className="px-2 py-1 border">{asset.name}</td>
                <td className="px-2 py-1 border">{asset.asset_class || '-'}</td>
                <td className="px-2 py-1 border">{asset.asset_type || '-'}</td>
                <td className="px-2 py-1 border">{asset.region || '-'}</td>
                <td className="px-2 py-1 border">{asset.sub_category || '-'}</td>
                <td className="px-2 py-1 border">{asset.currency}</td>
                <td className="px-2 py-1 border">{asset.exchange || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}