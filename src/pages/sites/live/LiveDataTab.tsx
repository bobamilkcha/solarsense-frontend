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
import { useLiveReadings } from '../../../hooks/useReadings'
import { formatDateTime, formatNumber, formatRelative } from '../../../lib/format'
import { compassDirection, sortReadings, toSeriesWithGaps } from '../../../lib/timeseries'
import { useSiteContext } from '../siteContext'

const STALE_AFTER_MS = 15 * 60_000

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

  const sorted = useMemo(() => sortReadings(readings.data ?? []), [readings.data])
  const series = useMemo(
    () => ({
      irradiance: toSeriesWithGaps(sorted, 'irradiance_wm2'),
      temp: toSeriesWithGaps(sorted, 'ambient_temp'),
      humidity: toSeriesWithGaps(sorted, 'humidity'),
    }),
    [sorted],
  )

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
  const span = `${formatDateTime(sorted[0].device_timestamp)} – ${formatDateTime(latest.device_timestamp)}`

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

      <ChartCard title="Irradiance (W/m²)" subtitle={`Last ${sorted.length} readings · ${span}`}>
        <TimeSeriesChart points={series.irradiance} label="Irradiance" unit="W/m²" decimals={0} height={260} />
      </ChartCard>
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Ambient temperature (°C)">
          <TimeSeriesChart points={series.temp} label="Temperature" unit="°C" />
        </ChartCard>
        <ChartCard title="Humidity (%)">
          <TimeSeriesChart points={series.humidity} label="Humidity" unit="%" decimals={0} />
        </ChartCard>
      </div>
      <p className="text-xs text-slate-500">Breaks in a line mean the device sent no data for that period.</p>

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
