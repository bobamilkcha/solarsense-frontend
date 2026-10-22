import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { formatNumber } from '../../lib/format'
import { CHART, SERIES } from './chartTheme'
import { ChartTooltipBox } from './ChartTooltip'

export type BarSeries = { key: string; label: string; color?: string }
export type BarDatum = { category: string } & Record<string, number | string | null>

type CategoryBarChartProps = {
  data: BarDatum[]
  series: BarSeries[]
  formatValue?: (value: number) => string
  height?: number
}

const DEFAULT_COLORS = [SERIES[1], SERIES[2]]

/** Vertical bars on one shared axis. Legend shown for 2+ series. */
export function CategoryBarChart({ data, series, formatValue = (v) => formatNumber(v), height = 260 }: CategoryBarChartProps) {
  const colored = series.map((s, i) => ({ ...s, color: s.color ?? DEFAULT_COLORS[i] ?? SERIES[1] }))

  function renderTooltip({ active, payload, label }: TooltipContentProps) {
    if (!active || !payload?.length) return null
    const datum = payload[0].payload as BarDatum
    return (
      <ChartTooltipBox
        title={label}
        rows={colored.map((s) => {
          const v = datum[s.key]
          return { color: s.color, label: s.label, value: typeof v === 'number' ? formatValue(v) : 'No data' }
        })}
      />
    )
  }

  return (
    <div>
      {colored.length > 1 && (
        <ul className="mb-2 flex flex-wrap gap-4 text-xs text-slate-600">
          {colored.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} aria-hidden="true" />
              {s.label}
            </li>
          ))}
        </ul>
      )}
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={2} barCategoryGap="20%">
            <CartesianGrid stroke={CHART.grid} vertical={false} />
            <XAxis
              dataKey="category"
              tick={{ fill: CHART.axis, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: CHART.grid }}
              interval="preserveStartEnd"
            />
            <YAxis
              width={56}
              tick={{ fill: CHART.axis, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => formatNumber(v, 0)}
            />
            <Tooltip content={renderTooltip} cursor={{ fill: '#f1f5f9' }} isAnimationActive={false} />
            {colored.map((s) => (
              <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
