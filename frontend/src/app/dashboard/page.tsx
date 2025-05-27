'use client'

import { useQuery } from '@tanstack/react-query'
import { dashboardAPI } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NetWorthChart } from '@/components/charts/NetWorthChart'
import { AllocationPieChart } from '@/components/charts/AllocationPieChart'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { ArrowUpIcon, ArrowDownIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useAuthStore } from "@/lib/api"

export default function DashboardPage() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const token = useAuthStore(state => state.token)
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardAPI.overview,
    enabled: !!token  // 
  })

  const handleRefreshPrices = async () => {
    setIsRefreshing(true)
    try {
      await dashboardAPI.refreshPrices()
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!data) {
    return null
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
          <ArrowPathIcon className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Prices
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Net Worth (JPY)</CardTitle>
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
            <CardTitle className="text-sm font-medium">Total Net Worth (USD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.total_usd, 'USD')}
            </div>
            <div className="text-sm text-muted-foreground">
              1 USD = ¥{(data.total_jpy / data.total_usd).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Bitcoin Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₿{data.total_btc.toFixed(8)}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatCurrency(data.breakdown_by_category.crypto || 0, 'JPY')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Net Worth Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <NetWorthChart data={data.history} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
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
            <CardTitle>By Account Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(data.breakdown_by_account_type).map(([type, value]) => (
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
            <CardTitle>By Currency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(data.breakdown_by_currency).map(([currency, value]) => (
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