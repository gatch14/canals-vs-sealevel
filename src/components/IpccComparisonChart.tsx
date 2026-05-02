// src/components/IpccComparisonChart.tsx
// Graphique BarChart recharts — Canaux (réaliste) vs IPCC AR6 2100
// UI-SPEC §Component Specification: IpccComparisonChart
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { Interval } from '../types/calculation'
import { IPCC_2100_RANGE_MM } from '../types/dashboard'

interface IpccComparisonChartProps {
  cumulativeDeltaSL: Interval  // scénario réaliste deltaSLmm
}

// Threat model T-06-08 : guard NaN/Infinity pour éviter crash recharts
function midpoint(iv: Interval): number {
  const v = (iv[0] + iv[1]) / 2
  return Number.isFinite(v) ? v : 0
}

export function IpccComparisonChart({ cumulativeDeltaSL }: IpccComparisonChartProps) {
  const chartData = [
    { name: 'Canaux',    value: midpoint(cumulativeDeltaSL), fill: '#3B82F6' },
    { name: 'IPCC 2100', value: midpoint(IPCC_2100_RANGE_MM), fill: '#374151' },
  ]

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart
        data={chartData}
        margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
        aria-label="Comparaison impact canaux vs IPCC 2100"
      >
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} />
        <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} unit=" mm" />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid rgba(255,255,255,0.08)',
            fontSize: 12,
          }}
          labelStyle={{ color: '#F9FAFB', fontWeight: 600 }}
          itemStyle={{ color: '#D1D5DB' }}
          formatter={(value: number, _name: string, entry: { payload?: { name?: string } }) => {
            const barName = entry?.payload?.name ?? _name
            if (barName === 'IPCC 2100') {
              return [`${value.toFixed(0)} mm`, '300–1000 mm (RCP2.6–8.5)']
            }
            return [`${value.toFixed(3)} mm`, barName]
          }}
        />
        <Bar dataKey="value" radius={[2, 2, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
