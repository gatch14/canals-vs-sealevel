// src/components/ElevationChart.tsx
// Graphique Recharts — profil altimétrique avec zones uphill en rouge
// ORDRE OBLIGATOIRE : ReferenceArea AVANT Area (sinon zones rouges par-dessus la courbe bleue)
import {
  AreaChart, Area, ReferenceArea, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { ElevationPoint, UphillSegment } from '../types/elevation'

interface Props {
  points: ElevationPoint[]
  uphillSegments: UphillSegment[]
}

export function ElevationChart({ points, uphillSegments }: Props) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart
        data={points}
        margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#374151"
          vertical={false}
        />
        <XAxis
          dataKey="distance"
          type="number"
          domain={['dataMin', 'dataMax']}
          tickFormatter={(v: number) => `${v.toFixed(0)}`}
          label={{ value: 'km', position: 'insideBottomRight', offset: -4, fill: '#9CA3AF', fontSize: 10 }}
          tick={{ fill: '#9CA3AF', fontSize: 10 }}
          axisLine={{ stroke: '#374151' }}
          tickLine={{ stroke: '#374151' }}
        />
        <YAxis
          domain={['auto', 'auto']}
          tickFormatter={(v: number) => `${v}`}
          label={{ value: 'm', angle: -90, position: 'insideLeft', offset: 8, fill: '#9CA3AF', fontSize: 10 }}
          tick={{ fill: '#9CA3AF', fontSize: 10 }}
          axisLine={{ stroke: '#374151' }}
          tickLine={{ stroke: '#374151' }}
          width={36}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#F3F4F6',
          }}
          formatter={(value: number) => [`${value.toFixed(0)} m`, 'Altitude']}
          labelFormatter={(label: number) => `Distance : ${label.toFixed(2)} km`}
        />

        {/* Zones uphill AVANT la courbe — obligatoire pour que le bleu soit au-dessus du rouge */}
        {uphillSegments.map((seg, i) => (
          <ReferenceArea
            key={i}
            x1={seg.distanceStart}
            x2={seg.distanceEnd}
            fill="#EF4444"
            fillOpacity={0.30}
            strokeOpacity={0}
          />
        ))}

        {/* Courbe principale bleue */}
        <Area
          type="monotone"
          dataKey="altitude"
          stroke="#3B82F6"
          strokeWidth={2}
          fill="#3B82F6"
          fillOpacity={0.15}
          dot={false}
          activeDot={{ r: 3, fill: '#3B82F6', strokeWidth: 0 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
