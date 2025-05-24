'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { formatCurrency, formatPercentage } from '@/lib/utils'

interface AllocationPieChartProps {
  data: Record<string, number>
}

const COLORS = {
  equity: '#0088FE',
  etf: '#00C49F',
  fund: '#FFBB28',
  bond: '#FF8042',
  crypto: '#8884D8',
  cash: '#82CA9D',
}

const CATEGORY_LABELS = {
  equity: '株式',
  etf: 'ETF',
  fund: '投資信託',
  bond: '債券',
  crypto: '暗号資産',
  cash: '現金',
}

export function AllocationPieChart({ data }: AllocationPieChartProps) {
  const total = Object.values(data).reduce((sum, value) => sum + value, 0)
  
  const chartData = Object.entries(data)
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