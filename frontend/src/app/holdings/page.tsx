'use client'

import { useEffect, useState } from 'react'
import { holdingsAPI, assetsAPI, ownersAPI } from '@/lib/api'
import type { Holding, Asset, Owner, HoldingCreate, AccountType } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  PlusIcon, 
  EditIcon, 
  TrashIcon, 
  SaveIcon, 
  XIcon,
  FolderIcon,
  TagIcon,
  SearchIcon,
  FilterIcon,
  SortAscIcon,
  SortDescIcon,
  PieChartIcon,
  UserIcon,
  CalendarIcon,
  BuildingIcon,
  CreditCardIcon
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

// スピナーコンポーネント
const Spinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }
  
  return (
    <div className={`animate-spin rounded-full border-b-2 border-primary ${sizeClasses[size]}`} />
  )
}

// フォーム状態の型定義
interface HoldingForm {
  asset_id: string
  owner_id: string
  quantity: string
  cost_total: string
  acquisition_date: string
  account_type: AccountType
  broker: string
  notes: string
}

// 初期フォーム状態
const INITIAL_FORM_STATE: HoldingForm = {
  asset_id: '',
  owner_id: '',
  quantity: '',
  cost_total: '',
  acquisition_date: '',
  account_type: 'specific',
  broker: '',
  notes: ''
}

// 口座タイプラベル
const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  NISA_growth: 'NISA成長投資枠',
  NISA_reserve: 'NISA積立投資枠',
  iDeCo: 'iDeCo',
  DC: '確定拠出年金',
  specific: '特定口座',
  general: '一般口座'
}

// フィルタリング・ソート用の型
type SortField = 'name' | 'quantity' | 'cost_total' | 'acquisition_date' | 'account_type' | 'owner'
type SortDirection = 'asc' | 'desc'

interface FilterState {
  search: string
  owner_id: string
  account_type: string
  asset_class: string
}

const INITIAL_FILTER_STATE: FilterState = {
  search: '',
  owner_id: '',
  account_type: '',
  asset_class: ''
}

export default function HoldingsPage() {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [owners, setOwners] = useState<Owner[]>([])
  const [currentPrices, setCurrentPrices] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null)
  const [formData, setFormData] = useState<HoldingForm>(INITIAL_FORM_STATE)
  
  // フィルタリング・ソート状態
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTER_STATE)
  const [sortField, setSortField] = useState<SortField>('acquisition_date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
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
    } finally {
      setIsLoading(false)
    }
  }

  // フォーム値更新
  const updateFormField = <K extends keyof HoldingForm>(
    field: K,
    value: HoldingForm[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // フォームリセット
  const resetForm = () => {
    setFormData(INITIAL_FORM_STATE)
    setEditingHolding(null)
    setShowAddForm(false)
  }

  // 編集開始
  const startEdit = (holding: Holding) => {
    setEditingHolding(holding)
    setFormData({
      asset_id: holding.asset.id,
      owner_id: holding.owner.id,
      quantity: holding.quantity.toString(),
      cost_total: holding.cost_total.toString(),
      acquisition_date: holding.acquisition_date,
      account_type: holding.account_type as AccountType,
      broker: holding.broker || '',
      notes: holding.notes || ''
    })
    setShowAddForm(true)
  }

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.asset_id || !formData.owner_id || !formData.quantity || !formData.cost_total || !formData.acquisition_date) {
      alert('必須項目を入力してください')
      return
    }

    setIsSubmitting(true)
    
    try {
      const holdingData: HoldingCreate = {
        asset_id: formData.asset_id,
        owner_id: formData.owner_id,
        quantity: Number(formData.quantity),
        cost_total: Number(formData.cost_total),
        acquisition_date: formData.acquisition_date,
        account_type: formData.account_type,
        broker: formData.broker || undefined,
        notes: formData.notes || undefined,
      }
      
      if (editingHolding) {
        await holdingsAPI.update(editingHolding.id, holdingData)
      } else {
        await holdingsAPI.create(holdingData)
      }
      
      await loadData()
      resetForm()
    } catch (error: any) {
      console.error('Failed to save holding:', error)
      alert(error.response?.data?.detail || 'エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 削除
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」の保有記録を削除しますか？`)) return
    
    try {
      await holdingsAPI.delete(id)
      await loadData()
    } catch (error) {
      console.error('Failed to delete holding:', error)
      alert('削除に失敗しました')
    }
  }

  // ソート
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // フィルタリング＆ソートされた保有資産リスト
  const filteredAndSortedHoldings = holdings
    .filter(holding => {
      // 検索フィルタ
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesAsset = holding.asset.name.toLowerCase().includes(searchLower) ||
                           (holding.asset.symbol?.toLowerCase().includes(searchLower))
        const matchesOwner = holding.owner.name.toLowerCase().includes(searchLower)
        const matchesBroker = holding.broker?.toLowerCase().includes(searchLower)
        if (!matchesAsset && !matchesOwner && !matchesBroker) return false
      }
      
      // 名義人フィルタ
      if (filters.owner_id && holding.owner.id !== filters.owner_id) return false
      
      // 口座種別フィルタ
      if (filters.account_type && holding.account_type !== filters.account_type) return false
      
      // 資産クラスフィルタ
      if (filters.asset_class && holding.asset.asset_class !== filters.asset_class) return false
      
      return true
    })
    .sort((a, b) => {
      let aVal: any, bVal: any
      
      switch (sortField) {
        case 'name':
          aVal = a.asset.name
          bVal = b.asset.name
          break
        case 'quantity':
          aVal = a.quantity
          bVal = b.quantity
          break
        case 'cost_total':
          aVal = a.cost_total
          bVal = b.cost_total
          break
        case 'acquisition_date':
          aVal = new Date(a.acquisition_date)
          bVal = new Date(b.acquisition_date)
          break
        case 'account_type':
          aVal = a.account_type
          bVal = b.account_type
          break
        case 'owner':
          aVal = a.owner.name
          bVal = b.owner.name
          break
        default:
          return 0
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

  // ローディング中
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* 登録・編集フォーム */}
      {showAddForm && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {editingHolding ? (
                <>
                  <EditIcon className="h-5 w-5" />
                  保有資産を編集
                </>
              ) : (
                <>
                  <PlusIcon className="h-5 w-5" />
                  新しい保有資産を登録
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* 基本情報セクション */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <FolderIcon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-primary">基本情報</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 名義人 */}
                  <div className="space-y-2">
                    <Label htmlFor="owner_id" className="text-sm font-medium text-foreground">
                      名義人 <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="owner_id"
                      value={formData.owner_id}
                      onChange={(e) => updateFormField('owner_id', e.target.value)}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    >
                      <option value="">名義人を選択</option>
                      {owners.map(owner => (
                        <option key={owner.id} value={owner.id}>
                          {owner.name} ({owner.owner_type})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 資産 */}
                  <div className="space-y-2">
                    <Label htmlFor="asset_id" className="text-sm font-medium text-foreground">
                      資産 <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="asset_id"
                      value={formData.asset_id}
                      onChange={(e) => updateFormField('asset_id', e.target.value)}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    >
                      <option value="">資産を選択</option>
                      {assets.map(asset => (
                        <option key={asset.id} value={asset.id}>
                          {asset.symbol ? `${asset.symbol} - ${asset.name}` : asset.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 数量 */}
                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-sm font-medium text-foreground">
                      数量 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.00000001"
                      value={formData.quantity}
                      onChange={(e) => updateFormField('quantity', e.target.value)}
                      placeholder="例: 100"
                      required
                      className="focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* 取得金額 */}
                  <div className="space-y-2">
                    <Label htmlFor="cost_total" className="text-sm font-medium text-foreground">
                      取得金額（合計） <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="cost_total"
                      type="number"
                      step="0.01"
                      value={formData.cost_total}
                      onChange={(e) => updateFormField('cost_total', e.target.value)}
                      placeholder="例: 1000000"
                      required
                      className="focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* 取得日 */}
                  <div className="space-y-2">
                    <Label htmlFor="acquisition_date" className="text-sm font-medium text-foreground">
                      取得日 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="acquisition_date"
                      type="date"
                      value={formData.acquisition_date}
                      onChange={(e) => updateFormField('acquisition_date', e.target.value)}
                      required
                      className="focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* 口座種別 */}
                  <div className="space-y-2">
                    <Label htmlFor="account_type" className="text-sm font-medium text-foreground">
                      口座種別 <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="account_type"
                      value={formData.account_type}
                      onChange={(e) => updateFormField('account_type', e.target.value as AccountType)}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    >
                      <option value="specific">特定口座</option>
                      <option value="general">一般口座</option>
                      <option value="NISA_growth">NISA成長投資枠</option>
                      <option value="NISA_reserve">NISA積立投資枠</option>
                      <option value="iDeCo">iDeCo</option>
                      <option value="DC">確定拠出年金</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 詳細情報セクション */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <TagIcon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-primary">詳細情報</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 証券会社 */}
                  <div className="space-y-2">
                    <Label htmlFor="broker" className="text-sm font-medium text-foreground">
                      証券会社
                    </Label>
                    <Input
                      id="broker"
                      type="text"
                      value={formData.broker}
                      onChange={(e) => updateFormField('broker', e.target.value)}
                      placeholder="例: SBI証券"
                      className="focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* メモ */}
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-medium text-foreground">
                      メモ
                    </Label>
                    <Input
                      id="notes"
                      type="text"
                      value={formData.notes}
                      onChange={(e) => updateFormField('notes', e.target.value)}
                      placeholder="例: 積立投資"
                      className="focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              {/* フォームボタン */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="min-w-[100px]"
                >
                  <XIcon className="h-4 w-4 mr-2" />
                  キャンセル
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner size="sm" />
                      <span className="ml-2">{editingHolding ? '更新中...' : '登録中...'}</span>
                    </>
                  ) : (
                    <>
                      <SaveIcon className="h-4 w-4 mr-2" />
                      {editingHolding ? '更新' : '登録'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ヘッダー */}
      {!showAddForm && (
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <PieChartIcon className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">保有資産</h1>
            </div>
            <p className="text-muted-foreground">
              投資している資産の保有状況を管理します
            </p>
          </div>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            新しい保有資産を登録
          </Button>
        </div>
      )}

      {/* フィルター・検索 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <FilterIcon className="h-5 w-5" />
              フィルター・検索
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? '簡易表示' : '詳細フィルター'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 検索バー */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="資産名、ティッカー、名義人、証券会社で検索..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>

            {/* 詳細フィルター */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 名義人フィルター */}
                <div className="space-y-2">
                  <Label htmlFor="filter-owner">名義人</Label>
                  <select
                    id="filter-owner"
                    value={filters.owner_id}
                    onChange={(e) => setFilters(prev => ({ ...prev, owner_id: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">すべて</option>
                    {owners.map(owner => (
                      <option key={owner.id} value={owner.id}>
                        {owner.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 口座種別フィルター */}
                <div className="space-y-2">
                  <Label htmlFor="filter-account-type">口座種別</Label>
                  <select
                    id="filter-account-type"
                    value={filters.account_type}
                    onChange={(e) => setFilters(prev => ({ ...prev, account_type: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">すべて</option>
                    <option value="specific">特定口座</option>
                    <option value="general">一般口座</option>
                    <option value="NISA_growth">NISA成長投資枠</option>
                    <option value="NISA_reserve">NISA積立投資枠</option>
                    <option value="iDeCo">iDeCo</option>
                    <option value="DC">確定拠出年金</option>
                  </select>
                </div>

                {/* 資産クラスフィルター */}
                <div className="space-y-2">
                  <Label htmlFor="filter-asset-class">資産クラス</Label>
                  <select
                    id="filter-asset-class"
                    value={filters.asset_class}
                    onChange={(e) => setFilters(prev => ({ ...prev, asset_class: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">すべて</option>
                    <option value="CashEq">現金等価物</option>
                    <option value="FixedIncome">債券</option>
                    <option value="Equity">株式</option>
                    <option value="RealAsset">実物資産</option>
                    <option value="Crypto">暗号資産</option>
                  </select>
                </div>
              </div>
            )}

            {/* フィルター結果 */}
            <div className="text-sm text-muted-foreground">
              {filteredAndSortedHoldings.length} / {holdings.length} 件の保有資産を表示
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 保有資産一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>保有資産一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAndSortedHoldings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {holdings.length === 0 ? 'まだ保有資産が登録されていません' : 'フィルター条件に一致する保有資産がありません'}
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('owner')}
                          className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground"
                        >
                          <UserIcon className="h-4 w-4 mr-1" />
                          名義人
                          {sortField === 'owner' && (
                            sortDirection === 'asc' ? <SortAscIcon className="h-4 w-4 ml-1" /> : <SortDescIcon className="h-4 w-4 ml-1" />
                          )}
                        </Button>
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('name')}
                          className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground"
                        >
                          資産
                          {sortField === 'name' && (
                            sortDirection === 'asc' ? <SortAscIcon className="h-4 w-4 ml-1" /> : <SortDescIcon className="h-4 w-4 ml-1" />
                          )}
                        </Button>
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('quantity')}
                          className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground"
                        >
                          数量
                          {sortField === 'quantity' && (
                            sortDirection === 'asc' ? <SortAscIcon className="h-4 w-4 ml-1" /> : <SortDescIcon className="h-4 w-4 ml-1" />
                          )}
                        </Button>
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('cost_total')}
                          className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground"
                        >
                          取得金額
                          {sortField === 'cost_total' && (
                            sortDirection === 'asc' ? <SortAscIcon className="h-4 w-4 ml-1" /> : <SortDescIcon className="h-4 w-4 ml-1" />
                          )}
                        </Button>
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('acquisition_date')}
                          className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground"
                        >
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          取得日
                          {sortField === 'acquisition_date' && (
                            sortDirection === 'asc' ? <SortAscIcon className="h-4 w-4 ml-1" /> : <SortDescIcon className="h-4 w-4 ml-1" />
                          )}
                        </Button>
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('account_type')}
                          className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground"
                        >
                          <CreditCardIcon className="h-4 w-4 mr-1" />
                          口座種別
                          {sortField === 'account_type' && (
                            sortDirection === 'asc' ? <SortAscIcon className="h-4 w-4 ml-1" /> : <SortDescIcon className="h-4 w-4 ml-1" />
                          )}
                        </Button>
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        <BuildingIcon className="h-4 w-4 mr-1 inline" />
                        証券会社
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedHoldings.map((holding, index) => (
                      <tr
                        key={holding.id}
                        className={`border-b transition-colors hover:bg-muted/50 ${
                          index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                        }`}
                      >
                        {/* 名義人 */}
                        <td className="h-12 px-4 align-middle">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium text-foreground">
                                {holding.owner.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {holding.owner.owner_type}
                              </div>
                            </div>
                          </div>
                        </td>
                         {/* 資産 */}
                         <td className="h-12 px-4 align-middle">
                          <div className="space-y-1">
                            <div className="font-medium text-foreground">
                              {holding.asset.symbol ? `${holding.asset.symbol} - ${holding.asset.name}` : holding.asset.name}
                            </div>
                            <div className="flex gap-1">
                              <Badge variant="outline" className="text-xs">
                                {holding.asset.asset_class}
                              </Badge>
                              {holding.asset.asset_type && (
                                <Badge variant="secondary" className="text-xs">
                                  {holding.asset.asset_type}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 数量 */}
                        <td className="h-12 px-4 align-middle">
                          <div className="text-right">
                            <div className="font-mono font-medium">
                              {new Intl.NumberFormat('ja-JP', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 8
                              }).format(holding.quantity)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              単価: {formatCurrency(holding.cost_per_unit, holding.asset.currency)}
                            </div>
                          </div>
                        </td>

                        {/* 取得金額 */}
                        <td className="h-12 px-4 align-middle">
                          <div className="text-right font-mono font-medium">
                            {formatCurrency(holding.cost_total, holding.asset.currency)}
                          </div>
                        </td>

                        {/* 取得日 */}
                        <td className="h-12 px-4 align-middle">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {formatDate(holding.acquisition_date)}
                            </span>
                          </div>
                        </td>

                        {/* 口座種別 */}
                        <td className="h-12 px-4 align-middle">
                          <Badge 
                            variant={
                              holding.account_type.startsWith('NISA') ? 'default' :
                              holding.account_type === 'iDeCo' || holding.account_type === 'DC' ? 'secondary' :
                              'outline'
                            }
                            className="text-xs"
                          >
                            {ACCOUNT_TYPE_LABELS[holding.account_type as AccountType]}
                          </Badge>
                        </td>

                        {/* 証券会社 */}
                        <td className="h-12 px-4 align-middle">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <BuildingIcon className="h-4 w-4" />
                            {holding.broker || '-'}
                          </div>
                        </td>

                        {/* 操作 */}
                        <td className="h-12 px-4 align-middle">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEdit(holding)}
                              className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/10"
                              title={`${holding.asset.name}を編集`}
                            >
                              <EditIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(holding.id, holding.asset.name)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              title={`${holding.asset.name}を削除`}
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