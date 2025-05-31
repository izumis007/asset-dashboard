"use client"

import { useEffect, useState } from "react"
import { holdingsAPI, assetsAPI, ownersAPI } from "@/lib/api"
import type { Holding, Asset, Owner, HoldingCreate, AccountType } from "@/types"

interface HoldingForm {
  asset_id: string // UUID string
  owner_id: string // UUID string
  quantity: string
  cost_total: string
  acquisition_date: string
  account_type: AccountType
  broker: string
  notes: string
}

export default function HoldingsPage() {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [owners, setOwners] = useState<Owner[]>([])
  const [form, setForm] = useState<HoldingForm>({
    asset_id: '', // UUID string
    owner_id: '', // UUID string
    quantity: '',
    cost_total: '',
    acquisition_date: '',
    account_type: 'specific',
    broker: '',
    notes: ''
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [holdingsData, assetsData, ownersData] = await Promise.all([
          holdingsAPI.list(),
          assetsAPI.list(), 
          ownersAPI.list()
        ])
        setHoldings(holdingsData)
        setAssets(assetsData)
        setOwners(ownersData)
      } catch (error) {
        console.error('Failed to load data:', error)
      }
    }
    loadData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const holdingData: HoldingCreate = {
        asset_id: form.asset_id,
        owner_id: form.owner_id,
        quantity: Number(form.quantity),
        cost_total: Number(form.cost_total),
        acquisition_date: form.acquisition_date,
        account_type: form.account_type,
        broker: form.broker || undefined,
        notes: form.notes || undefined,
      }
      
      await holdingsAPI.create(holdingData)
      const updated = await holdingsAPI.list()
      setHoldings(updated)
      
      // フォームリセット
      setForm({
        asset_id: '',
        owner_id: '',
        quantity: '',
        cost_total: '',
        acquisition_date: '',
        account_type: 'specific',
        broker: '',
        notes: ''
      })
    } catch (err) {
      alert("エラーが発生しました")
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">保有資産</h1>

      <form onSubmit={handleSubmit} className="space-y-2 mb-6 border p-4 rounded">
        <select name="owner_id" value={form.owner_id} onChange={handleChange} required className="w-full p-1 border">
          <option value="">名義人を選択</option>
          {owners.map(owner => (
            <option key={owner.id} value={owner.id}>
              {owner.name} ({owner.owner_type})
            </option>
          ))}
        </select>

        <select name="asset_id" value={form.asset_id} onChange={handleChange} required className="w-full p-1 border">
          <option value="">資産を選択</option>
          {assets.map(asset => (
            <option key={asset.id} value={asset.id}>
              {asset.symbol ? `${asset.symbol} - ${asset.name}` : asset.name}
            </option>
          ))}
        </select>

        <input type="number" name="quantity" value={form.quantity} onChange={handleChange} placeholder="数量" required className="w-full p-1 border" />
        <input type="number" name="cost_total" value={form.cost_total} onChange={handleChange} placeholder="取得金額（合計）" required className="w-full p-1 border" />
        <input type="date" name="acquisition_date" value={form.acquisition_date} onChange={handleChange} required className="w-full p-1 border" />

        <select name="account_type" value={form.account_type} onChange={handleChange} required className="w-full p-1 border">
          <option value="specific">特定口座</option>
          <option value="general">一般口座</option>
          <option value="NISA_growth">NISA成長投資枠</option>
          <option value="NISA_reserve">NISA積立投資枠</option>
          <option value="iDeCo">iDeCo</option>
          <option value="DC">確定拠出年金</option>
        </select>

        <input type="text" name="broker" value={form.broker} onChange={handleChange} placeholder="証券会社" className="w-full p-1 border" />
        <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="メモ" className="w-full p-1 border" />

        <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">登録</button>
      </form>

      <table className="w-full border">
        <thead>
          <tr>
            <th className="border px-2 py-1">名義人</th>
            <th className="border px-2 py-1">資産</th>
            <th className="border px-2 py-1">数量</th>
            <th className="border px-2 py-1">取得金額</th>
            <th className="border px-2 py-1">取得日</th>
            <th className="border px-2 py-1">口座種別</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map(h => (
            <tr key={h.id}>
              <td className="border px-2 py-1">{h.owner.name}</td>
              <td className="border px-2 py-1">
                {h.asset.symbol ? `${h.asset.symbol} - ${h.asset.name}` : h.asset.name}
              </td>
              <td className="border px-2 py-1">{h.quantity}</td>
              <td className="border px-2 py-1">{h.cost_total}</td>
              <td className="border px-2 py-1">{h.acquisition_date}</td>
              <td className="border px-2 py-1">{h.account_type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}