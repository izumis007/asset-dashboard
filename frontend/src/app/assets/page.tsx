"use client"

import { useState, useEffect } from "react"
import { assetsAPI } from "@/lib/api"
import type { Asset, AssetCreate } from "@/types"

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [form, setForm] = useState<AssetCreate>({
    symbol: "",
    name: "",
    category: "equity",
    currency: "JPY",
    exchange: "",
    isin: "",
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    assetsAPI.list().then(setAssets).catch(() => {
      setError("資産一覧の取得に失敗しました")
    })
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await assetsAPI.create(form)
      const updated = await assetsAPI.list()
      setAssets(updated)
      setForm({
        symbol: "",
        name: "",
        category: "equity",
        currency: "JPY",
        exchange: "",
        isin: "",
      })
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || "登録に失敗しました")
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">資産の登録</h1>

      <form onSubmit={handleSubmit} className="mb-6 space-y-2 border p-4 rounded">
        <input
          type="text"
          name="symbol"
          value={form.symbol}
          onChange={handleChange}
          placeholder="ティッカー (例: BTC, TSLA)"
          required
          className="w-full p-1 border"
        />
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="名称 (例: ビットコイン, テスラ)"
          required
          className="w-full p-1 border"
        />
        <select name="category" value={form.category} onChange={handleChange} required className="w-full p-1 border">
          <option value="equity">株式</option>
          <option value="etf">ETF</option>
          <option value="fund">投資信託</option>
          <option value="bond">債券</option>
          <option value="crypto">暗号資産</option>
          <option value="cash">現金</option>
        </select>
        <select name="currency" value={form.currency} onChange={handleChange} required className="w-full p-1 border">
          <option value="JPY">JPY</option>
          <option value="USD">USD</option>
          <option value="BTC">BTC</option>
        </select>
        <input
          type="text"
          name="exchange"
          value={form.exchange}
          onChange={handleChange}
          placeholder="取引所 (任意)"
          className="w-full p-1 border"
        />
        <input
          type="text"
          name="isin"
          value={form.isin}
          onChange={handleChange}
          placeholder="ISINコード (任意)"
          className="w-full p-1 border"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">登録</button>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </form>

      <h2 className="text-lg font-semibold mb-2">登録済みの資産</h2>
      <table className="w-full border">
        <thead>
          <tr>
            <th className="border px-2 py-1">ティッカー</th>
            <th className="border px-2 py-1">名称</th>
            <th className="border px-2 py-1">カテゴリ</th>
            <th className="border px-2 py-1">サブカテゴリ</th> 
            <th className="border px-2 py-1">通貨</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <tr key={asset.id}>
              <td className="border px-2 py-1">{asset.symbol}</td>
              <td className="border px-2 py-1">{asset.name}</td>
              <td className="border px-2 py-1">{asset.category}</td>
              <td className="border px-2 py-1">{asset.sub_category || "-"}</td>
              <td className="border px-2 py-1">{asset.currency}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}