'use client'

import { useQuery } from '@tanstack/react-query'
import { dashboardAPI, useAuthStore } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NetWorthChart } from '@/components/charts/NetWorthChart'
import { AllocationPieChart } from '@/components/charts/AllocationPieChart'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { ArrowUpIcon, ArrowDownIcon, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()
  
  const { token, isAuthenticated } = useAuthStore()

  // 認証チェック
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardAPI.overview,
    enabled: isAuthenticated(),
    retry: (failureCount, error: any) => {
      // 401エラーの場合はリトライしない
      if (error?.response?.status === 401) {
        return false
      }
      return failureCount < 3
    }
  })

  const handleRefreshPrices = async () => {
    setIsRefreshing(true)
    try {
      await dashboardAPI.refreshPrices()
      await refetch()
    } catch (error) {
      console.error('価格更新エラー:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // 認証されていない場合は何も表示しない
  if (!isAuthenticated()) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">ダッシュボードを読み込み中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 mb-4">
          データの読み込みに失敗しました
        </div>
        <Button onClick={() => refetch()}>
          再試行
        </Button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Asset Dashboard</h1>
          <p className="text-muted-foreground mb-4">
            まだデータがありません。資産と保有情報を登録してください。
          </p>
          <div className="space-x-4">
            <Button onClick={() => router.push('/assets')}>
              資産を登録
            </Button>
            <Button variant="outline" onClick={() => router.push('/holdings')}>
              保有情報を登録
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const isPositiveChange = data.change_percentage >= 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Asset Dashboard</h1>
        <Button
          onClick={handleRefreshPrices}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          {isRefreshing ? (
            <RefreshCw className="animate-spin h-4 w-4 mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          価格更新
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">総資産 (JPY)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.total_jpy, 'JPY')}
            </div>
            <div className={`flex items-center text-sm ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
              {isPositiveChange ? (
                <ArrowUpIcon className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 mr-1" />
              )}
              {formatCurrency(Math.abs(data.change_24h), 'JPY')} ({formatPercentage(Math.abs(data.change_percentage))})
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">総資産 (USD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.total_usd, 'USD')}
            </div>
            <div className="text-sm text-muted-foreground">
              1 USD = ¥{data.total_usd > 0 ? (data.total_jpy / data.total_usd).toFixed(2) : '0'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">ビットコイン保有量</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₿{data.total_btc.toFixed(8)}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatCurrency(data.breakdown_by_category?.crypto || 0, 'JPY')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>資産推移</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <NetWorthChart data={data.history} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>資産配分</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <AllocationPieChart data={data.breakdown_by_category} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>口座種別別</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(data.breakdown_by_account_type || {}).map(([type, value]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="capitalize">{type}</span>
                  <span className="font-medium">{formatCurrency(value, 'JPY')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>通貨別</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(data.breakdown_by_currency || {}).map(([currency, value]) => (
                <div key={currency} className="flex justify-between items-center">
                  <span>{currency}</span>
                  <span className="font-medium">
                    {formatCurrency(value, currency as any)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}