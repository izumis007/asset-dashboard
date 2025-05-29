'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Download,
  Calculator,
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Building,
  Edit,
  Trash2,
  Bitcoin,
  ArrowUpCircle,
  ArrowDownCircle,
  FileText
} from 'lucide-react'

// 型定義
interface BTCTrade {
  id: number
  txid?: string | null
  amount_btc: number
  counter_value_jpy: number
  jpy_rate: number
  fee_btc: number
  fee_jpy: number
  timestamp: string
  exchange: string
  trade_type: 'buy' | 'sell'
  notes?: string | null
}

interface BTCTradeFormData {
  txid: string
  amount_btc: string
  counter_value_jpy: string
  jpy_rate: string
  fee_btc: string
  fee_jpy: string
  timestamp: string
  exchange: string
  trade_type: 'buy' | 'sell'
  notes: string
}

interface TradeStats {
  totalBought: number
  totalSold: number
  totalInvested: number
  totalReceived: number
}

// Mock data
const mockTrades: BTCTrade[] = [
  {
    id: 1,
    txid: 'a1b2c3d4e5f6',
    amount_btc: 0.1,
    counter_value_jpy: 650000,
    jpy_rate: 6500000,
    fee_btc: 0.0001,
    fee_jpy: 500,
    timestamp: '2024-01-15T10:30:00Z',
    exchange: 'bitFlyer',
    trade_type: 'buy',
    notes: 'DCA購入'
  },
  {
    id: 2,
    txid: 'b2c3d4e5f6g7',
    amount_btc: 0.05,
    counter_value_jpy: 350000,
    jpy_rate: 7000000,
    fee_btc: 0.00005,
    fee_jpy: 300,
    timestamp: '2024-02-10T14:20:00Z',
    exchange: 'Coincheck',
    trade_type: 'buy',
    notes: '追加購入'
  },
  {
    id: 3,
    txid: 'c3d4e5f6g7h8',
    amount_btc: -0.02,
    counter_value_jpy: 140000,
    jpy_rate: 7000000,
    fee_btc: 0.00002,
    fee_jpy: 200,
    timestamp: '2024-03-05T09:45:00Z',
    exchange: 'bitFlyer',
    trade_type: 'sell',
    notes: '一部利確'
  }
]

const exchanges: string[] = [
  'bitFlyer',
  'Coincheck',
  'GMOコイン',
  'DMM Bitcoin',
  'Bitbank',
  'Liquid',
  'その他'
]

export default function BTCTradesPage() {
  const [trades, setTrades] = useState<BTCTrade[]>(mockTrades)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTrade, setEditingTrade] = useState<BTCTrade | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [calculationMethod, setCalculationMethod] = useState<'FIFO' | 'HIFO'>('FIFO')
  
  const [formData, setFormData] = useState<BTCTradeFormData>({
    txid: '',
    amount_btc: '',
    counter_value_jpy: '',
    jpy_rate: '',
    fee_btc: '0',
    fee_jpy: '0',
    timestamp: '',
    exchange: 'bitFlyer',
    trade_type: 'buy',
    notes: ''
  })

  // 統計計算
  const stats: TradeStats = trades.reduce((acc, trade) => {
    if (trade.trade_type === 'buy') {
      acc.totalBought += Math.abs(trade.amount_btc)
      acc.totalInvested += trade.counter_value_jpy + trade.fee_jpy
    } else {
      acc.totalSold += Math.abs(trade.amount_btc)
      acc.totalReceived += trade.counter_value_jpy - trade.fee_jpy
    }
    return acc
  }, {
    totalBought: 0,
    totalSold: 0,
    totalInvested: 0,
    totalReceived: 0
  })

  const currentHolding = stats.totalBought - stats.totalSold
  const totalFees = trades.reduce((sum, trade) => sum + trade.fee_jpy, 0)
  const avgBuyPrice = stats.totalBought > 0 ? stats.totalInvested / stats.totalBought : 0

  const handleSubmit = () => {
    const tradeData: Omit<BTCTrade, 'id'> = {
      txid: formData.txid || null,
      amount_btc: formData.trade_type === 'sell' ? -Math.abs(parseFloat(formData.amount_btc)) : Math.abs(parseFloat(formData.amount_btc)),
      counter_value_jpy: parseFloat(formData.counter_value_jpy),
      jpy_rate: parseFloat(formData.jpy_rate),
      fee_btc: parseFloat(formData.fee_btc),
      fee_jpy: parseFloat(formData.fee_jpy),
      timestamp: new Date(formData.timestamp).toISOString(),
      exchange: formData.exchange,
      trade_type: formData.trade_type,
      notes: formData.notes || null
    }

    if (editingTrade) {
      setTrades(trades.map(trade => 
        trade.id === editingTrade.id ? { ...tradeData, id: editingTrade.id } : trade
      ))
      setEditingTrade(null)
    } else {
      const newTrade: BTCTrade = { ...tradeData, id: Date.now() }
      setTrades([...trades, newTrade])
    }
    
    // フォームリセット
    setFormData({
      txid: '',
      amount_btc: '',
      counter_value_jpy: '',
      jpy_rate: '',
      fee_btc: '0',
      fee_jpy: '0',
      timestamp: '',
      exchange: 'bitFlyer',
      trade_type: 'buy',
      notes: ''
    })
    setShowAddForm(false)
  }

  const handleEdit = (trade: BTCTrade) => {
    setFormData({
      txid: trade.txid || '',
      amount_btc: Math.abs(trade.amount_btc).toString(),
      counter_value_jpy: trade.counter_value_jpy.toString(),
      jpy_rate: trade.jpy_rate.toString(),
      fee_btc: trade.fee_btc.toString(),
      fee_jpy: trade.fee_jpy.toString(),
      timestamp: new Date(trade.timestamp).toISOString().slice(0, 16),
      exchange: trade.exchange,
      trade_type: trade.trade_type,
      notes: trade.notes || ''
    })
    setEditingTrade(trade)
    setShowAddForm(true)
  }

  const handleDelete = (id: number) => {
    if (confirm('この取引を削除しますか？')) {
      setTrades(trades.filter(trade => trade.id !== id))
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatBTC = (amount: number): string => {
    return `₿${amount.toFixed(8)}`
  }

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('ja-JP')
  }

  const handleCalculateGains = (sellTrade: BTCTrade) => {
    // 実際のAPIコールに置き換え
    alert(`${sellTrade.txid}の損益計算を実行します (${calculationMethod}方式)`)
  }

  const handleExportReport = () => {
    // 実際のAPIコールに置き換え
    alert(`${selectedYear}年の取引レポートをダウンロードします`)
  }

  // 年次フィルタリング
  const years: number[] = Array.from(new Set(trades.map(trade => new Date(trade.timestamp).getFullYear())))
  const filteredTrades = trades.filter(trade => 
    new Date(trade.timestamp).getFullYear() === selectedYear
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bitcoin className="h-8 w-8 text-orange-500" />
            Bitcoin取引管理
          </h1>
          <p className="text-muted-foreground">取引履歴の管理と損益計算</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          新規取引追加
        </Button>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">保有BTC</p>
                <p className="text-2xl font-bold text-orange-600">{formatBTC(currentHolding)}</p>
              </div>
              <Bitcoin className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">総投資額</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalInvested)}</p>
              </div>
              <ArrowUpCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">平均購入単価</p>
                <p className="text-2xl font-bold">{formatCurrency(avgBuyPrice || 0)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">手数料合計</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalFees)}</p>
              </div>
              <ArrowDownCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 損益計算・レポート */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            損益計算・レポート
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="year-select">対象年:</Label>
              <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="p-2 rounded border"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}年</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="method-select">計算方式:</Label>
              <select
                id="method-select"
                value={calculationMethod}
                onChange={(e) => setCalculationMethod(e.target.value as 'FIFO' | 'HIFO')}
                className="p-2 rounded border"
              >
                <option value="FIFO">FIFO (先入先出)</option>
                <option value="HIFO">HIFO (高値先出)</option>
              </select>
            </div>
            
            <Button
              onClick={handleExportReport}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              年次レポート出力
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 取引一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>取引履歴 ({selectedYear}年)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTrades.map((trade) => (
              <Card key={trade.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4">
                      {/* 取引タイプアイコン */}
                      <div className={`p-2 rounded-full ${
                        trade.trade_type === 'buy' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {trade.trade_type === 'buy' ? (
                          <ArrowUpCircle className="h-5 w-5" />
                        ) : (
                          <ArrowDownCircle className="h-5 w-5" />
                        )}
                      </div>
                      
                      {/* 取引詳細 */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={trade.trade_type === 'buy' ? 'default' : 'destructive'}>
                            {trade.trade_type === 'buy' ? '購入' : '売却'}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{trade.exchange}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">BTC数量</p>
                            <p className="font-mono font-bold">{formatBTC(Math.abs(trade.amount_btc))}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">単価</p>
                            <p className="font-mono">{formatCurrency(trade.jpy_rate)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">取引金額</p>
                            <p className="font-bold">{formatCurrency(trade.counter_value_jpy)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">手数料</p>
                            <p className="text-red-600">{formatCurrency(trade.fee_jpy)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDateTime(trade.timestamp)}
                          </span>
                          {trade.txid && (
                            <span className="font-mono">TX: {trade.txid}</span>
                          )}
                        </div>
                        
                        {trade.notes && (
                          <p className="text-sm text-muted-foreground">💭 {trade.notes}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* アクションボタン */}
                    <div className="flex items-center gap-1">
                      {trade.trade_type === 'sell' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCalculateGains(trade)}
                          title="損益計算"
                        >
                          <Calculator className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(trade)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(trade.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredTrades.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {selectedYear}年の取引履歴がありません
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 追加/編集フォーム */}
      {showAddForm && (
        <Card className="fixed inset-0 z-50 m-4 overflow-auto bg-background">
          <CardHeader>
            <CardTitle>
              {editingTrade ? 'BTC取引編集' : '新規BTC取引追加'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 取引種別・時刻 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="trade_type">取引種別 *</Label>
                  <select
                    id="trade_type"
                    value={formData.trade_type}
                    onChange={(e) => setFormData({...formData, trade_type: e.target.value as 'buy' | 'sell'})}
                    className="w-full p-2 rounded border"
                  >
                    <option value="buy">購入</option>
                    <option value="sell">売却</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="timestamp">取引日時 *</Label>
                  <Input
                    id="timestamp"
                    type="datetime-local"
                    value={formData.timestamp}
                    onChange={(e) => setFormData({...formData, timestamp: e.target.value})}
                  />
                </div>
              </div>

              {/* BTC数量・単価 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount_btc">BTC数量 *</Label>
                  <Input
                    id="amount_btc"
                    type="number"
                    step="0.00000001"
                    value={formData.amount_btc}
                    onChange={(e) => setFormData({...formData, amount_btc: e.target.value})}
                    placeholder="0.00000000"
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="jpy_rate">BTC単価（円） *</Label>
                  <Input
                    id="jpy_rate"
                    type="number"
                    value={formData.jpy_rate}
                    onChange={(e) => {
                      const rate = e.target.value
                      const amount = formData.amount_btc
                      setFormData({
                        ...formData, 
                        jpy_rate: rate,
                        counter_value_jpy: amount && rate ? (parseFloat(amount) * parseFloat(rate)).toString() : formData.counter_value_jpy
                      })
                    }}
                    placeholder="6500000"
                    className="font-mono"
                  />
                </div>
              </div>

              {/* 取引金額・取引所 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="counter_value_jpy">取引金額（円） *</Label>
                  <Input
                    id="counter_value_jpy"
                    type="number"
                    value={formData.counter_value_jpy}
                    onChange={(e) => setFormData({...formData, counter_value_jpy: e.target.value})}
                    placeholder="650000"
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="exchange">取引所</Label>
                  <select
                    id="exchange"
                    value={formData.exchange}
                    onChange={(e) => setFormData({...formData, exchange: e.target.value})}
                    className="w-full p-2 rounded border"
                  >
                    {exchanges.map(exchange => (
                      <option key={exchange} value={exchange}>{exchange}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 手数料 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fee_btc">手数料（BTC）</Label>
                  <Input
                    id="fee_btc"
                    type="number"
                    step="0.00000001"
                    value={formData.fee_btc}
                    onChange={(e) => setFormData({...formData, fee_btc: e.target.value})}
                    placeholder="0.00000000"
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="fee_jpy">手数料（円）</Label>
                  <Input
                    id="fee_jpy"
                    type="number"
                    value={formData.fee_jpy}
                    onChange={(e) => setFormData({...formData, fee_jpy: e.target.value})}
                    placeholder="500"
                    className="font-mono"
                  />
                </div>
              </div>

              {/* TX ID・メモ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="txid">トランザクションID</Label>
                  <Input
                    id="txid"
                    value={formData.txid}
                    onChange={(e) => setFormData({...formData, txid: e.target.value})}
                    placeholder="a1b2c3d4e5f6..."
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">メモ</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="DCA購入など"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingTrade(null)
                  }}
                >
                  キャンセル
                </Button>
                <Button onClick={handleSubmit}>
                  {editingTrade ? '更新' : '追加'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}