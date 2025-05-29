'use client'

import { useEffect, useState } from 'react'
import { assetsAPI } from '@/lib/api'
import { Asset, AssetCreate, AssetClass, AssetType, Region } from '@/types'

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])

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
    const fetchAssets = async () => {
      const res = await assetsAPI.list()
      setAssets(res)
    }
    fetchAssets()
  }, [])

  const handleSubmit = async () => {
    const newAsset: AssetCreate = {
      symbol,
      name,
      asset_class: assetClass || undefined,
      ...(assetType && { asset_type: assetType }),
      ...(region && { region }),
      ...(subCategory && { sub_category: subCategory }),
      currency,
      ...(exchange && { exchange }),
      ...(isin && { isin }),
    }
  
    try {
      await assetsAPI.create(newAsset)
      const res = await assetsAPI.list()
      setAssets(res)
  
      // 入力フォームのリセット
      setSymbol('')
      setName('')
      setAssetClass('Equity')
      setAssetType(undefined)
      setRegion(undefined)
      setSubCategory(undefined)
      setCurrency('JPY')
      setExchange('')
      setIsin('')
    } catch (error) {
      console.error("Asset creation failed:", error)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">資産の登録</h1>
      <div className="space-y-2 mb-6">
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="w-full p-2 rounded text-black"
          placeholder="ティッカー（例: BTC, TSLA）"
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 rounded text-black"
          placeholder="名称（例: ビットコイン, テスラ）"
        />
        <select
          value={assetClass}
          onChange={(e) => setAssetClass(e.target.value as AssetClass)}
          className="w-full p-2 rounded text-black"
        >
          <option value="CashEq">現金等</option>
          <option value="FixedIncome">債券</option>
          <option value="Equity">株式</option>
          <option value="RealAsset">実物資産</option>
          <option value="Crypto">暗号資産</option>
        </select>
        <input
          type="text"
          value={assetType}
          onChange={(e) => setAssetType(e.target.value as AssetType)}
          className="w-full p-2 rounded text-black"
          placeholder="資産タイプ（任意）"
        />
        <input
          type="text"
          value={region}
          onChange={(e) => setRegion(e.target.value as Region)}
          className="w-full p-2 rounded text-black"
          placeholder="地域（任意、例: JP, US）"
        />
        <input
          type="text"
          value={subCategory}
          onChange={(e) => setSubCategory(e.target.value)}
          className="w-full p-2 rounded text-black"
          placeholder="サブカテゴリ（任意）"
        />
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="w-full p-2 rounded text-black"
        >
          <option value="JPY">JPY</option>
          <option value="USD">USD</option>
          <option value="BTC">BTC</option>
          <option value="ETH">ETH</option>
        </select>
        <input
          type="text"
          value={exchange}
          onChange={(e) => setExchange(e.target.value)}
          className="w-full p-2 rounded text-black"
          placeholder="取引所（任意）"
        />
        <input
          type="text"
          value={isin}
          onChange={(e) => setIsin(e.target.value)}
          className="w-full p-2 rounded text-black"
          placeholder="ISINコード（任意）"
        />
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          登録
        </button>
      </div>

      <h2 className="text-lg font-semibold mb-2">登録済みの資産</h2>
      <table className="w-full text-left table-auto">
        <thead>
          <tr className="border-b">
            <th className="px-2 py-1">ティッカー</th>
            <th className="px-2 py-1">名称</th>
            <th className="px-2 py-1">分類</th>
            <th className="px-2 py-1">タイプ</th>
            <th className="px-2 py-1">地域</th>
            <th className="px-2 py-1">通貨</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <tr key={asset.id} className="border-b">
              <td className="px-2 py-1">{asset.symbol}</td>
              <td className="px-2 py-1">{asset.name}</td>
              <td className="px-2 py-1">{asset.asset_class}</td>
              <td className="px-2 py-1">{asset.asset_type || '-'}</td>
              <td className="px-2 py-1">{asset.region || '-'}</td>
              <td className="px-2 py-1">{asset.currency}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}