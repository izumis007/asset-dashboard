'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { formatCurrency, formatPercentage } from '@/lib/utils'

interface AllocationPieChartProps {
  data: Record<string, number>
}

// 新しい分類システムのみ（旧CASHEQ等完全除去）
const COLORS = {
  CashEq: '#82CA9D',        // 現金等価物 - 緑
  FixedIncome: '#FF8042',   // 債券 - オレンジ
  Equity: '#0088FE',        // 株式 - 青
  RealAsset: '#FFBB28',     // 実物資産 - 黄色
  Crypto: '#8884D8',        // 暗号資産 - 紫
}

const CATEGORY_LABELS = {
  CashEq: '現金等価物',
  FixedIncome: '債券',
  Equity: '株式',
  RealAsset: '実物資産',
  Crypto: '暗号資産',
}

export function AllocationPieChart({ data }: AllocationPieChartProps) {
  // dataがundefinedまたはnullの場合は空オブジェクトを使用
  const safeData = data || {}
  const total = Object.values(safeData).reduce((sum, value) => sum + value, 0)
  
  // データが空の場合の処理
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">データがありません</p>
      </div>
    )
  }
  
  const chartData = Object.entries(safeData)
    .filter(([_, value]) => value > 0)
    .map(([category, value]) => ({
      name: CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category,
      value: value,
      percentage: (value / total) * 100,
    }))
    .sort((a, b) => b.value - a.value)

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium">{data.name}</p>
          <p className="text-sm">{formatCurrency(data.value, 'JPY')}</p>
          <p className="text-sm text-muted-foreground">
            {formatPercentage(data.payload.percentage)}
          </p>
        </div>
      )
    }
    return null
  }

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    if (percent < 0.05) return null // Don't show label for small slices
    
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => {
            // 新しい分類システムのカテゴリから元のキーを逆引き
            const category = Object.keys(CATEGORY_LABELS).find(
              key => CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS] === entry.name
            )
            return (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[category as keyof typeof COLORS] || '#888888'} 
              />
            )
          })}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          verticalAlign="bottom" 
          height={36}
          formatter={(value) => `${value}`}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}