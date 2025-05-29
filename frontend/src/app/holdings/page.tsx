'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Building,
  Edit,
  Trash2,
  Percent,
  DollarSign,
  PieChart
} from 'lucide-react'

// 型定義
interface Asset {
  id: number
  symbol: string
  name: string
  currency: string
}

interface Holding {
  id: number
  asset: Asset
  quantity: number
  cost_total: number
  cost_per_unit: number
  current_price: number
  acquisition_date: string
  account_type: 'NISA' | 'iDeCo' | 'taxable'
  broker?: string | null
  notes?: string | null
}

interface HoldingFormData {
  asset_id: string
  quantity: string
  cost_total: string
  acquisition_date: string
  account_type: 'NISA' | 'iDeCo' | 'taxable'
  broker: string
  notes: string
}

interface AccountTypeInfo {
  value: 'NISA' | 'iDeCo' | 'taxable'
  label: string
  color: string
}

interface MockAsset {
  id: number
  symbol: string
  name: string
}

// Mock data
const mockHoldings: Holding[] = [
  {
    id: 1,
    asset: {
      id: 1,
      symbol: 'AAPL',
      name: 'Apple Inc.',
      currency: 'USD'
    },
    quantity: 50,
    cost_total: 750000, // JPY
    cost_per_unit: 15000,
    current_price: 18000, // JPY換算
    acquisition_date: '2024-01-15',
    account_type: 'NISA',
    broker: 'SBI証券',
    notes: '長期保有予定'
  },
  {
    id: 2,
    asset: {
      id: 2,
      symbol: 'BTC',
      name: 'Bitcoin',
      currency: 'BTC'
    },
    quantity: 0.5,
    cost_total: 2500000, // JPY
    cost_per_unit: 5000000,
    current_price: 6500000, // JPY換算
    acquisition_date: '2023-12-01',
    account_type: 'taxable',
    broker: 'Coincheck',
    notes: 'DCA戦略'
  },
  {
    id: 3,
    asset: {
      id: 3,
      symbol: '1306',
      name: 'TOPIX連動型ETF',
      currency: 'JPY'
    },
    quantity: 1000,
    cost_total: 1800000,
    cost_per_unit: 1800,
    current_price: 1950,
    acquisition_date: '2024-02-01',
    account_type: 'iDeCo',
    broker: '楽天証券',
    notes: 'インデックス投資'
  }
]

const mockAssets: MockAsset[] = [
  { id: 1, symbol: 'AAPL', name: 'Apple Inc.' },
  { id: 2, symbol: 'BTC', name: 'Bitcoin' },
  { id: 3, symbol: '1306', name: 'TOPIX連動型ETF' },
  { id: 4, symbol: 'MSFT', name: 'Microsoft Corporation' }
]

const accountTypes: AccountTypeInfo[] = [
  { value: 'NISA', label: 'NISA', color: 'bg-green-100 text-green-800' },
  { value: 'iDeCo', label: 'iDeCo', color: 'bg-blue-100 text-blue-800' },
  { value: 'taxable', label: '課税口座', color: 'bg-gray-100 text-gray-800' }
]

export default function EnhancedHoldingsPage() {
  const [holdings, setHoldings] = useState<Holding[]>(mockHoldings)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null)
  const [selectedAccountType, setSelectedAccountType] = useState<'all' | 'NISA' | 'iDeCo' | 'taxable'>('all')
  
  const [formData, setFormData] = useState<HoldingFormData>({
    asset_id: '',
    quantity: '',
    cost_total: '',
    acquisition_date: '',
    account_type: 'taxable',
    broker: '',
    notes: ''
  })

  // フィルタされた保有資産
  const filteredHoldings = holdings.filter(holding => 
    selectedAccountType === 'all' || holding.account_type === selectedAccountType
  )

  // 総計算
  const totalStats = holdings.reduce((acc, holding) => {
    const currentValue = holding.quantity * holding.current_price
    const gainLoss = currentValue - holding.cost_total

    return {
      totalCost: acc.totalCost + holding.cost_total,
      totalValue: acc.totalValue + currentValue,
      totalGainLoss: acc.totalGainLoss + gainLoss
    }
  }, { totalCost: 0, totalValue: 0, totalGainLoss: 0 })

  const totalGainLossPercent = totalStats.totalCost > 0 ? (totalStats.totalGainLoss / totalStats.totalCost) * 100 : 0

  const handleSubmit = () => {
    const selectedAsset = mockAssets.find(a => a.id === parseInt(formData.asset_id))
    
    if (!selectedAsset) {
      alert('資産を選択してください')
      return
    }
    
    if (editingHolding) {
      setHoldings(holdings.map(holding => 
        holding.id === editingHolding.id 
          ? { 
              ...holding, 
              asset: {
                id: selectedAsset.id,
                symbol: selectedAsset.symbol,
                name: selectedAsset.name,
                currency: 'JPY' // デフォルト値
              },
              quantity: parseFloat(formData.quantity),
              cost_total: parseFloat(formData.cost_total),
              cost_per_unit: parseFloat(formData.cost_total) / parseFloat(formData.quantity),
              acquisition_date: formData.acquisition_date,
              account_type: formData.account_type,
              broker: formData.broker || null,
              notes: formData.notes || null
            }
          : holding
      ))
      setEditingHolding(null)
    } else {
      const newHolding: Holding = {
        id: Date.now(),
        asset: {
          id: selectedAsset.id,
          symbol: selectedAsset.symbol,
          name: selectedAsset.name,
          currency: 'JPY' // デフォルト値
        },
        quantity: parseFloat(formData.quantity),
        cost_total: parseFloat(formData.cost_total),
        cost_per_unit: parseFloat(formData.cost_total) / parseFloat(formData.quantity),
        current_price: parseFloat(formData.cost_total) / parseFloat(formData.quantity), // 仮の現在価格
        acquisition_date: formData.acquisition_date,
        account_type: formData.account_type,
        broker: formData.broker || null,
        notes: formData.notes || null
      }
      setHoldings([...holdings, newHolding])
    }
    
    // フォームリセット
    setFormData({
      asset_id: '',
      quantity: '',
      cost_total: '',
      acquisition_date: '',
      account_type: 'taxable',
      broker: '',
      notes: ''
    })
    setShowAddForm(false)
  }

  const handleEdit = (holding: Holding) => {
    setFormData({
      asset_id: holding.asset.id.toString(),
      quantity: holding.quantity.toString(),
      cost_total: holding.cost_total.toString(),
      acquisition_date: holding.acquisition_date,
      account_type: holding.account_type,
      broker: holding.broker || '',
      notes: holding.notes || ''
    })
    setEditingHolding(holding)
    setShowAddForm(true)
  }

  const handleDelete = (id: number) => {
    if (confirm('この保有資産を削除しますか？')) {
      setHoldings(holdings.filter(holding => holding.id !== id))
    }
  }

  const formatCurrency = (amount: number, currency: string = 'JPY'): string => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: currency === 'BTC' ? 'JPY' : currency,
      minimumFractionDigits: currency === 'JPY' ? 0 : 2
    }).format(amount)
  }

  const getAccountTypeInfo = (type: 'NISA' | 'iDeCo' | 'taxable'): AccountTypeInfo => {
    return accountTypes.find(at => at.value === type) || accountTypes[2]
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">保有資産</h1>
          <p className="text-muted-foreground">ポートフォリオの管理・追跡</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          新規保有資産追加
        </Button>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">総投資額</p>
                <p className="text-2xl font-bold">{formatCurrency(totalStats.totalCost)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">現在評価額</p>
                <p className="text-2xl font-bold">{formatCurrency(totalStats.totalValue)}</p>
              </div>
              <PieChart className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">評価損益</p>
                <p className={`text-2xl font-bold ${totalStats.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalStats.totalGainLoss)}
                </p>
              </div>
              {totalStats.totalGainLoss >= 0 ? 
                <TrendingUp className="h-8 w-8 text-green-500" /> : 
                <TrendingDown className="h-8 w-8 text-red-500" />
              }
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">利回り</p>
                <p className={`text-2xl font-bold ${totalGainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalGainLossPercent.toFixed(2)}%
                </p>
              </div>
              <Percent className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* フィルター */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-2">
            <Button
              variant={selectedAccountType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedAccountType('all')}
            >
              すべて
            </Button>
            {accountTypes.map(type => (
              <Button
                key={type.value}
                variant={selectedAccountType === type.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedAccountType(type.value)}
              >
                {type.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 保有資産一覧 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredHoldings.map((holding) => {
          const currentValue = holding.quantity * holding.current_price
          const gainLoss = currentValue - holding.cost_total
          const gainLossPercent = (gainLoss / holding.cost_total) * 100
          const accountInfo = getAccountTypeInfo(holding.account_type)
          
          return (
            <Card key={holding.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span className="font-mono text-lg">{holding.asset.symbol}</span>
                      <Badge className={accountInfo.color}>
                        {accountInfo.label}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{holding.asset.name}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(holding)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(holding.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* 数量・単価 */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">保有数量</p>
                      <p className="font-medium">{holding.quantity.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">平均取得単価</p>
                      <p className="font-medium font-mono">{formatCurrency(holding.cost_per_unit)}</p>
                    </div>
                  </div>

                  {/* 投資額・評価額 */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">投資額</p>
                      <p className="font-medium">{formatCurrency(holding.cost_total)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">評価額</p>
                      <p className="font-medium">{formatCurrency(currentValue)}</p>
                    </div>
                  </div>

                  {/* 損益 */}
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">評価損益</span>
                      <div className="text-right">
                        <p className={`font-bold ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(gainLoss)}
                        </p>
                        <p className={`text-sm ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ({gainLossPercent >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 詳細情報 */}
                  <div className="border-t pt-3 space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      取得日: {holding.acquisition_date}
                    </div>
                    {holding.broker && (
                      <div className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {holding.broker}
                      </div>
                    )}
                    {holding.notes && (
                      <p className="text-xs">💭 {holding.notes}</p>
                    )}
                  </div>
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
              {editingHolding ? '保有資産編集' : '新規保有資産追加'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="asset_id">資産 *</Label>
                  <select
                    id="asset_id"
                    value={formData.asset_id}
                    onChange={(e) => setFormData({...formData, asset_id: e.target.value})}
                    className="w-full p-2 rounded border"
                  >
                    <option value="">資産を選択</option>
                    {mockAssets.map(asset => (
                      <option key={asset.id} value={asset.id}>
                        {asset.symbol} - {asset.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="account_type">口座種別 *</Label>
                  <select
                    id="account_type"
                    value={formData.account_type}
                    onChange={(e) => setFormData({...formData, account_type: e.target.value as 'NISA' | 'iDeCo' | 'taxable'})}
                    className="w-full p-2 rounded border"
                  >
                    {accountTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">数量 *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.000001"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    placeholder="保有数量"
                  />
                </div>
                <div>
                  <Label htmlFor="cost_total">取得金額（合計） *</Label>
                  <Input
                    id="cost_total"
                    type="number"
                    value={formData.cost_total}
                    onChange={(e) => setFormData({...formData, cost_total: e.target.value})}
                    placeholder="取得金額（円）"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="acquisition_date">取得日 *</Label>
                  <Input
                    id="acquisition_date"
                    type="date"
                    value={formData.acquisition_date}
                    onChange={(e) => setFormData({...formData, acquisition_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="broker">証券会社</Label>
                  <Input
                    id="broker"
                    value={formData.broker}
                    onChange={(e) => setFormData({...formData, broker: e.target.value})}
                    placeholder="例: SBI証券"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">メモ</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="投資方針やメモなど"
                  className="w-full p-2 rounded border h-20 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingHolding(null)
                  }}
                >
                  キャンセル
                </Button>
                <Button onClick={handleSubmit}>
                  {editingHolding ? '更新' : '追加'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredHoldings.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              {selectedAccountType === 'all' 
                ? '保有資産がありません。新規追加してください。'
                : `${getAccountTypeInfo(selectedAccountType).label}の保有資産がありません。`
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}