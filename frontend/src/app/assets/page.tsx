'use client'

import { useEffect, useState } from 'react'
import { assetsAPI } from '@/lib/api'
import { Asset, AssetCreate } from '@/types'

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [symbol, setSymbol] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState<'equity' | 'etf' | 'fund' | 'bond' | 'crypto' | 'cash'>('equity')
  const [subCategory, setSubCategory] = useState('')
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
      category,
      sub_category: subCategory,
      currency,
      exchange,
      isin,
    }
    await assetsAPI.create(newAsset)
    const res = await assetsAPI.list()
    setAssets(res)

    // Reset form
    setSymbol('')
    setName('')
    setCategory('equity')
    setSubCategory('')
    setCurrency('JPY')
    setExchange('')
    setIsin('')
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
          value={category}
          onChange={(e) => setCategory(e.target.value as AssetCreate['category'])}
          className="w-full p-2 rounded text-black"
        >
          <option value="equity">株式</option>
          <option value="etf">ETF</option>
          <option value="fund">投資信託</option>
          <option value="bond">債券</option>
          <option value="crypto">暗号資産</option>
          <option value="cash">現金</option>
        </select>
        <input
          type="text"
          value={subCategory}
          onChange={(e) => setSubCategory(e.target.value)}
          className="w-full p-2 rounded text-black"
          placeholder="サブカテゴリ（例: S&P500、米国債、タンス預金）"
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
            <th className="px-2 py-1">カテゴリ</th>
            <th className="px-2 py-1">サブカテゴリ</th>
            <th className="px-2 py-1">通貨</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <tr key={asset.id} className="border-b">
              <td className="px-2 py-1">{asset.symbol}</td>
              <td className="px-2 py-1">{asset.name}</td>
              <td className="px-2 py-1">{asset.category}</td>
              <td className="px-2 py-1">{asset.sub_category || '-'}</td>
              <td className="px-2 py-1">{asset.currency}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}