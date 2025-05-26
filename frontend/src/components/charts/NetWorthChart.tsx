'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { formatCurrency, formatDate } from '@/lib/utils'

interface NetWorthChartProps {
  data: Array<{
    date: string
    total_jpy: number
    total_usd: number
  }>
}

export function NetWorthChart({ data }: NetWorthChartProps) {
  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `¥${(value / 1000000).toFixed(1)}M`
    }
    return `¥${(value / 1000).toFixed(0)}K`
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value, entry.dataKey === 'total_usd' ? 'USD' : 'JPY')}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          tickFormatter={(value) => formatDate(value)}
          className="text-xs"
        />
        <YAxis
          tickFormatter={formatYAxis}
          className="text-xs"
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickFormatter={formatYAxis}
          className="text-xs"
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          type="monotone"
          dataKey="total_jpy"
          name="JPY"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 8 }}
        />
        <Line
          type="monotone"
          dataKey="total_usd"
          name="USD"
          stroke="hsl(var(--secondary))"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 8 }}
          yAxisId="right"
          hide
        />
      </LineChart>
    </ResponsiveContainer>
  )
}