import { useEffect, useMemo, useRef, useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
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
  /** Enables drag-to-zoom: called with the selected time range (ms). */
  onZoom?: (from: number, to: number) => void
}

// Plot area insets: the Y axis width and the chart's right margin, used to map the cursor to a time.
const Y_AXIS_WIDTH = 48
const RIGHT_MARGIN = 12
const WHEEL_ZOOM_STEP = 1.25

const DAY_MS = 24 * 60 * 60 * 1000

export function TimeSeriesChart({
  points,
  label,
  unit,
  decimals = 1,
  height = 220,
  domain,
  color = SERIES[1],
  onZoom,
}: TimeSeriesChartProps) {
  const [drag, setDrag] = useState<{ from: number; to: number } | null>(null)
  // A point with a gap on both sides has no line to draw, so show it as a dot.
  const isolated = useMemo(() => {
    const set = new Set<number>()
    points.forEach((p, i) => {
      if (p.value !== null && points[i - 1]?.value == null && points[i + 1]?.value == null) set.add(p.t)
    })
    return set
  }, [points])
  const containerRef = useRef<HTMLDivElement>(null)
  const wheelState = useRef({ domain, onZoom })
  useEffect(() => {
    wheelState.current = { domain, onZoom }
  })
  // Scroll to zoom around the cursor. Attached natively because React's wheel
  // listener is passive and could not stop the page from scrolling.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    function handleWheel(event: WheelEvent) {
      const { domain: d, onZoom: zoom } = wheelState.current
      if (!d || !zoom || !el) return
      event.preventDefault()
      const rect = el.getBoundingClientRect()
      const plotWidth = rect.width - Y_AXIS_WIDTH - RIGHT_MARGIN
      const span = d[1] - d[0]
      // Sideways scrolling pans along the time axis instead of zooming.
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        const shift = (event.deltaX / plotWidth) * span
        zoom(d[0] + shift, d[1] + shift)
        return
      }
      const fraction = Math.min(1, Math.max(0, (event.clientX - rect.left - Y_AXIS_WIDTH) / plotWidth))
      const nextSpan = event.deltaY < 0 ? span / WHEEL_ZOOM_STEP : span * WHEEL_ZOOM_STEP
      const anchor = d[0] + fraction * span
      zoom(anchor - fraction * nextSpan, anchor + (1 - fraction) * nextSpan)
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [])

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

  const labelToTime = (label: unknown) => (typeof label === 'number' ? label : null)

  function finishDrag() {
    if (drag && onZoom && drag.from !== drag.to) onZoom(Math.min(drag.from, drag.to), Math.max(drag.from, drag.to))
    setDrag(null)
  }

  return (
    <div ref={containerRef} style={{ height }} className={onZoom ? 'w-full cursor-crosshair select-none' : 'w-full'}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={points}
          margin={{ top: 8, right: RIGHT_MARGIN, bottom: 0, left: 0 }}
          onMouseDown={(e) => {
            const t = labelToTime(e?.activeLabel)
            if (onZoom && t !== null) setDrag({ from: t, to: t })
          }}
          onMouseMove={(e) => {
            const t = labelToTime(e?.activeLabel)
            if (drag && t !== null) setDrag({ ...drag, to: t })
          }}
          onMouseUp={finishDrag}
          onMouseLeave={() => setDrag(null)}
        >
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
            width={Y_AXIS_WIDTH}
            tick={{ fill: CHART.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatNumber(v, 0)}
          />
          {drag && <ReferenceArea x1={drag.from} x2={drag.to} fill={color} fillOpacity={0.15} stroke={color} strokeOpacity={0.4} />}
          <Tooltip content={renderTooltip} cursor={{ stroke: CHART.crosshair, strokeWidth: 1 }} isAnimationActive={false} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={(props: { cx?: number; cy?: number; payload?: SeriesPoint; index?: number }) => {
              const { cx, cy, payload, index } = props
              if (cx == null || cy == null || !payload || !isolated.has(payload.t)) return <g key={index} />
              return <circle key={index} cx={cx} cy={cy} r={3} fill={color} />
            }}
            activeDot={{ r: 4, stroke: CHART.surface, strokeWidth: 2, fill: color }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
