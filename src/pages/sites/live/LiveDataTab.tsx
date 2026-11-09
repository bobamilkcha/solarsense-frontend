import { useMemo, useState } from 'react'
import type { SensorReading } from '../../../api/types'
import { ChartCard } from '../../../components/charts/ChartCard'
import { TimeSeriesChart } from '../../../components/charts/TimeSeriesChart'
import { ReadingsTable } from '../../../components/ReadingsTable'
import { StatTile } from '../../../components/StatTile'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/States'
import { LIVE_POLL_INTERVAL_MS } from '../../../config'
import { useNow } from '../../../hooks/useNow'
import { LIVE_MAX_HISTORY_MS, useLiveReadings, useLiveWeek } from '../../../hooks/useReadings'
import { formatDateTime, formatNumber, formatRelative } from '../../../lib/format'
import { compassDirection, sortReadings, toIntervalSeries, toSeriesWithGaps } from '../../../lib/timeseries'
import { useSiteContext } from '../siteContext'

const SELECT_CLASS =
  'rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none'

const STALE_AFTER_MS = 15 * 60_000

/** Chart point spacing. 0 plots every reading as sent by the device. */
/** How far back from the latest reading the charts look. Live data is kept for 7 days. */
const WINDOW_OPTIONS = [
  { ms: 15 * 60_000, label: 'Last 15 minutes' },
  { ms: 60 * 60_000, label: 'Last hour' },
  { ms: 6 * 60 * 60_000, label: 'Last 6 hours' },
  { ms: 24 * 60 * 60_000, label: 'Last 24 hours' },
  { ms: LIVE_MAX_HISTORY_MS, label: 'Last 7 days' },
]

/** The live poll covers about 8 hours; longer windows also load the full week. */
const NEEDS_WEEK_ABOVE_MS = 6 * 60 * 60_000

/** Aim for at most this many points per chart so a week stays smooth. */
const MAX_POINTS = 800

const MIN_ZOOM_SPAN_MS = 30_000

const INTERVAL_OPTIONS = [
  { ms: 0, label: 'Every reading' },
  { ms: 10_000, label: '10 seconds' },
  { ms: 30_000, label: '30 seconds' },
  { ms: 60_000, label: '1 minute' },
  { ms: 5 * 60_000, label: '5 minutes' },
  { ms: 15 * 60_000, label: '15 minutes' },
  { ms: 60 * 60_000, label: '1 hour' },
]

function formatInterval(ms: number): string {
  if (ms >= 60 * 60_000) return `${+(ms / (60 * 60_000)).toFixed(1)} h`
  if (ms >= 60_000) return `${+(ms / 60_000).toFixed(1)} min`
  return `${Math.round(ms / 1000)} s`
}

function LatestCards({ latest }: { latest: SensorReading }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      <StatTile
        label="Irradiance"
        value={formatNumber(latest.irradiance_wm2, 0)}
        unit="W/m²"
        detail="Approximate (calibration pending)"
      />
      <StatTile label="Ambient temperature" value={formatNumber(latest.ambient_temp)} unit="°C" />
      <StatTile label="Humidity" value={formatNumber(latest.humidity, 0)} unit="%" />
      <StatTile
        label="Tilt"
        value={formatNumber(latest.tilt_deg, 0)}
        unit="°"
        detail={`Roll ${formatNumber(latest.roll, 0)}° · pitch ${formatNumber(latest.pitch, 0)}° (0° is flat)`}
      />
      <StatTile
        label="Heading"
        value={formatNumber(latest.heading, 0)}
        unit={`° ${compassDirection(latest.heading)}`}
        detail="Compass direction"
      />
    </div>
  )
}

export function LiveDataTab() {
  const { site } = useSiteContext()
  const readings = useLiveReadings(site.id)
  const now = useNow()
  const [showTable, setShowTable] = useState(false)
  const [intervalMs, setIntervalMs] = useState(0)
  const [windowMs, setWindowMs] = useState(60 * 60_000)

  const [zoom, setZoom] = useState<[number, number] | null>(null)
  const week = useLiveWeek(site.id, (zoom ? zoom[1] - zoom[0] : windowMs) > NEEDS_WEEK_ABOVE_MS)

  const sorted = useMemo(
    () => sortReadings([...(readings.data ?? []), ...(week.data?.readings ?? [])]),
    [readings.data, week.data],
  )
  const latestMs = sorted.length ? Date.parse(sorted[sorted.length - 1].device_timestamp) : 0
  // The view is the zoomed range, or the chosen window ending at the newest reading.
  const view: [number, number] = zoom ?? [latestMs - windowMs, latestMs]
  const [viewFrom, viewTo] = view

  /** Keep zoom inside the 7 days of live data and no tighter than a few readings. */
  function applyZoom(from: number, to: number) {
    const span = Math.min(Math.max(to - from, MIN_ZOOM_SPAN_MS), LIVE_MAX_HISTORY_MS)
    const start = Math.min(Math.max(from, latestMs - LIVE_MAX_HISTORY_MS), latestMs - span)
    setZoom([start, start + span])
  }

  const windowed = useMemo(
    () => sorted.filter((r) => {
      const t = Date.parse(r.device_timestamp)
      return t >= viewFrom && t <= viewTo
    }),
    [sorted, viewFrom, viewTo],
  )
  // Average automatically when the view would hold too many points to read.
  const autoMs = (viewTo - viewFrom) / MAX_POINTS >= 10_000 ? Math.ceil((viewTo - viewFrom) / MAX_POINTS / 1000) * 1000 : 0
  const effectiveMs = Math.max(intervalMs, autoMs)
  const series = useMemo(() => {
    const build = (field: 'irradiance_wm2' | 'ambient_temp' | 'humidity') =>
      effectiveMs ? toIntervalSeries(windowed, field, effectiveMs) : toSeriesWithGaps(windowed, field)
    return { irradiance: build('irradiance_wm2'), temp: build('ambient_temp'), humidity: build('humidity') }
  }, [windowed, effectiveMs])

  if (readings.isPending) return <LoadingState label="Loading latest readings…" />
  if (readings.isError && !readings.data) {
    return <ErrorState error={readings.error} title="Couldn't load readings" onRetry={() => readings.refetch()} />
  }
  if (sorted.length === 0) {
    return (
      <EmptyState
        title="No readings yet"
        description={
          <>
            Waiting for device <span className="font-mono">{site.device_id}</span>. Check that it's powered on, connected
            to Wi-Fi, and that its device ID matches exactly. This page checks for new data automatically.
          </>
        }
      />
    )
  }

  const latest = sorted[sorted.length - 1]
  const latestAge = now - Date.parse(latest.device_timestamp)
  const span = `${formatDateTime(viewFrom)} – ${formatDateTime(viewTo)}`

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
        <p className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${latestAge > STALE_AFTER_MS ? 'bg-slate-400' : 'animate-pulse bg-emerald-500'}`}
            aria-hidden="true"
          />
          Last reading {formatRelative(latest.device_timestamp, now)} ({formatDateTime(latest.device_timestamp)})
        </p>
        <p className="text-xs">
          {readings.isFetching ? 'Updating…' : `Auto-refreshes every ${LIVE_POLL_INTERVAL_MS / 1000} s`}
        </p>
      </div>

      {latestAge > STALE_AFTER_MS && (
        <Alert tone="warning">
          No new readings for {formatRelative(latest.device_timestamp, now).replace(' ago', '')}. The device may be off,
          out of Wi-Fi range, or still uploading delayed data.
        </Alert>
      )}
      {readings.isError && (
        <Alert tone="error">Couldn't refresh just now. Showing the last data received; retrying automatically.</Alert>
      )}

      <LatestCards latest={latest} />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <label className="flex items-center gap-2 text-slate-600">
          Show
          <select value={windowMs} onChange={(e) => {
              setWindowMs(Number(e.target.value))
              setZoom(null)
            }} className={SELECT_CLASS}>
            {WINDOW_OPTIONS.map((o) => (
              <option key={o.ms} value={o.ms}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-slate-600">
          Point every
          <select value={intervalMs} onChange={(e) => setIntervalMs(Number(e.target.value))} className={SELECT_CLASS}>
            {INTERVAL_OPTIONS.map((o) => (
              <option key={o.ms} value={o.ms}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        {zoom && (
          <Button variant="secondary" size="sm" onClick={() => setZoom(null)}>
            Reset zoom
          </Button>
        )}
        {effectiveMs > 0 && (
          <span className="text-xs text-slate-500">
            Readings are averaged every {formatInterval(effectiveMs)}
            {effectiveMs > intervalMs ? ' to keep the chart readable; zoom in for more detail' : ''}.
          </span>
        )}
        {week.isFetching && <span className="text-xs text-slate-500">Loading older readings…</span>}
        {week.isError && <span className="text-xs text-red-600">Couldn't load older readings.</span>}
        {week.data?.truncated && <span className="text-xs text-amber-700">Some of the week is missing (too many readings).</span>}
      </div>

      <ChartCard title="Irradiance (W/m²)" subtitle={`${windowed.length} readings · ${span}`}>
        <TimeSeriesChart points={series.irradiance} label="Irradiance" unit="W/m²" decimals={0} height={260} domain={view} onZoom={applyZoom} />
      </ChartCard>
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Ambient temperature (°C)">
          <TimeSeriesChart points={series.temp} label="Temperature" unit="°C" domain={view} onZoom={applyZoom} />
        </ChartCard>
        <ChartCard title="Humidity (%)">
          <TimeSeriesChart points={series.humidity} label="Humidity" unit="%" decimals={0} domain={view} onZoom={applyZoom} />
        </ChartCard>
      </div>
      <p className="text-xs text-slate-500">Scroll over a chart to zoom, or drag across it to select a range. Breaks in a line mean the device sent no data for that period.</p>

      <div>
        <Button variant="secondary" size="sm" onClick={() => setShowTable((v) => !v)} aria-expanded={showTable}>
          {showTable ? 'Hide table' : 'Show readings as a table'}
        </Button>
        {showTable && (
          <div className="mt-3">
            <ReadingsTable readings={sorted} maxRows={50} />
          </div>
        )}
      </div>
    </div>
  )
}
