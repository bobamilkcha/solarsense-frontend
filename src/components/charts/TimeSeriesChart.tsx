import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { formatDate, formatDateTime, formatNumber, formatTime } from '../../lib/format'
import type { SeriesPoint } from '../../lib/timeseries'
import { CHART, SERIES } from './chartTheme'
import { ChartTooltipBox } from './ChartTooltip'

type TimeSeriesChartProps = {
  points: SeriesPoint[]
  /** Series name for the tooltip, e.g. "Irradiance". */
  label: string
  unit: string
  decimals?: number
  height?: number
  /** Fix the x-axis to a range (History); otherwise fit the data (Live). */
  domain?: [number, number]
  color?: string
}

const DAY_MS = 24 * 60 * 60 * 1000

export function TimeSeriesChart({
  points,
  label,
  unit,
  decimals = 1,
  height = 220,
  domain,
  color = SERIES[1],
}: TimeSeriesChartProps) {
  const first = domain?.[0] ?? points[0]?.t ?? 0
  const last = domain?.[1] ?? points[points.length - 1]?.t ?? 0
  const multiDay = last - first > 1.5 * DAY_MS
  const formatTick = (t: number) => (multiDay ? formatDate(t) : formatTime(t))

  function renderTooltip({ active, payload }: TooltipContentProps) {
    const point = payload?.[0]?.payload as SeriesPoint | undefined
    if (!active || !point || point.value === null) return null
    return (
      <ChartTooltipBox
        title={formatDateTime(point.t)}
        rows={[{ color, label, value: `${formatNumber(point.value, decimals)} ${unit}` }]}
      />
    )
  }

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={domain ?? ['dataMin', 'dataMax']}
            tickFormatter={formatTick}
            tick={{ fill: CHART.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: CHART.grid }}
            minTickGap={48}
          />
          <YAxis
            width={48}
            tick={{ fill: CHART.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatNumber(v, 0)}
          />
          <Tooltip content={renderTooltip} cursor={{ stroke: CHART.crosshair, strokeWidth: 1 }} isAnimationActive={false} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={false}
            activeDot={{ r: 4, stroke: CHART.surface, strokeWidth: 2, fill: color }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
