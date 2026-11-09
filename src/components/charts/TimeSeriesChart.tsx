import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { formatDate, formatDateTime, formatNumber, formatTime } from '../../lib/format'
import type { SeriesPoint } from '../../lib/timeseries'
import { type ChartBenchmark, colorAt, gradientStops, MINIMUM_LINE_COLOR, REFERENCE_LINE_COLOR } from './benchmarks'
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
  /** Draws the reference line(s) and colors the line by how good each value is. */
  benchmark?: ChartBenchmark
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
  benchmark,
}: TimeSeriesChartProps) {
  const gradientId = useId()
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

  const extent = useMemo(() => {
    let min = Infinity
    let max = -Infinity
    for (const p of points) {
      if (p.value === null) continue
      min = Math.min(min, p.value)
      max = Math.max(max, p.value)
    }
    return min <= max ? { min, max } : null
  }, [points])
  // A flat line has no vertical extent for a gradient, so it falls back to one color.
  const gradient = benchmark && extent && extent.max > extent.min ? gradientStops(benchmark.stops, extent.min, extent.max) : null
  const flatColor = benchmark && extent && extent.max === extent.min ? colorAt(benchmark.stops, extent.min) : null
  const strokeColor = gradient ? `url(#${gradientId})` : (flatColor ?? color)
  // Keep the reference lines on the chart even when every reading is below them.
  const yTop = benchmark ? Math.max(benchmark.reference.value, benchmark.minimum?.value ?? 0) : 0

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
          {gradient && (
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                {gradient.map((g, i) => (
                  <stop key={i} offset={g.offset} stopColor={g.color} />
                ))}
              </linearGradient>
            </defs>
          )}
          <YAxis
            domain={benchmark ? [0, (dataMax: number) => Math.max(dataMax, yTop)] : undefined}
            width={Y_AXIS_WIDTH}
            tick={{ fill: CHART.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatNumber(v, 0)}
          />
          {drag && <ReferenceArea x1={drag.from} x2={drag.to} fill={color} fillOpacity={0.15} stroke={color} strokeOpacity={0.4} />}
          {benchmark?.minimum && (
            <ReferenceLine
              y={benchmark.minimum.value}
              stroke={MINIMUM_LINE_COLOR}
              strokeDasharray="6 4"
              strokeOpacity={0.7}
              label={{ value: benchmark.minimum.label, position: 'insideBottomRight', fill: MINIMUM_LINE_COLOR, fontSize: 11 }}
            />
          )}
          {benchmark && (
            <ReferenceLine
              y={benchmark.reference.value}
              stroke={REFERENCE_LINE_COLOR}
              strokeWidth={2}
              label={{ value: benchmark.reference.label, position: 'insideTopRight', fill: '#a16207', fontSize: 11 }}
            />
          )}
          <Tooltip content={renderTooltip} cursor={{ stroke: CHART.crosshair, strokeWidth: 1 }} isAnimationActive={false} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={(props: { cx?: number; cy?: number; payload?: SeriesPoint; index?: number }) => {
              const { cx, cy, payload, index } = props
              if (cx == null || cy == null || !payload || !isolated.has(payload.t)) return <g key={index} />
              return <circle key={index} cx={cx} cy={cy} r={3} fill={benchmark && payload.value !== null ? colorAt(benchmark.stops, payload.value) : color} />
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
