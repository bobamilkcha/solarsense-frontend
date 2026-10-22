import { useMemo, useState } from 'react'
import { getErrorMessage } from '../../../api/errors'
import { exportReadings, type ExportFormat } from '../../../api/readings'
import { ChartCard } from '../../../components/charts/ChartCard'
import { TimeSeriesChart } from '../../../components/charts/TimeSeriesChart'
import { ReadingsTable } from '../../../components/ReadingsTable'
import { StatTile } from '../../../components/StatTile'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/States'
import { HISTORY_MAX_PAGES, useReadingsInRange } from '../../../hooks/useReadings'
import { addDays, isValidDateString, startOfLocalDate, toLocalDateString } from '../../../lib/dates'
import { formatNumber } from '../../../lib/format'
import { sortReadings, summarize, toBucketedSeries } from '../../../lib/timeseries'
import { useSiteContext } from '../siteContext'
import { DateRangePicker, type DateRange } from './DateRangePicker'

function defaultRange(): DateRange {
  const today = toLocalDateString(new Date())
  return { from: addDays(today, -6), to: today }
}

function ExportButtons({ siteId, siteName, start, end }: { siteId: string; siteName: string; start: Date; end: Date }) {
  const [busy, setBusy] = useState<ExportFormat | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run(format: ExportFormat) {
    setBusy(format)
    setError(null)
    try {
      await exportReadings(siteId, format, start, end, siteName)
    } catch (e) {
      setError(getErrorMessage(e, "Couldn't export the data."))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" loading={busy === 'csv'} disabled={busy !== null} onClick={() => run('csv')}>
          Export CSV
        </Button>
        <Button variant="secondary" size="sm" loading={busy === 'xlsx'} disabled={busy !== null} onClick={() => run('xlsx')}>
          Export Excel
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function HistoryTab() {
  const { site } = useSiteContext()
  const [range, setRange] = useState<DateRange>(defaultRange)
  const [showTable, setShowTable] = useState(false)

  const valid = isValidDateString(range.from) && isValidDateString(range.to) && range.from <= range.to
  const start = useMemo(() => startOfLocalDate(range.from), [range.from])
  // End is exclusive: midnight after the last selected day.
  const end = useMemo(() => startOfLocalDate(addDays(range.to, 1)), [range.to])

  const query = useReadingsInRange(site.id, start, end)
  const sorted = useMemo(() => sortReadings(query.data?.readings ?? []), [query.data])
  const domain: [number, number] = [start.getTime(), end.getTime()]
  const series = useMemo(() => {
    const [from, to] = [start.getTime(), end.getTime()]
    return {
      irradiance: toBucketedSeries(sorted, 'irradiance_wm2', from, to),
      temp: toBucketedSeries(sorted, 'ambient_temp', from, to),
      humidity: toBucketedSeries(sorted, 'humidity', from, to),
    }
  }, [sorted, start, end])
  const irr = summarize(sorted, 'irradiance_wm2')
  const temp = summarize(sorted, 'ambient_temp')
  const hum = summarize(sorted, 'humidity')

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-end sm:justify-between">
        <DateRangePicker value={range} onChange={setRange} />
        {valid && <ExportButtons siteId={site.id} siteName={site.name} start={start} end={end} />}
      </div>

      {!valid ? (
        <Alert tone="error">Choose a start date on or before the end date.</Alert>
      ) : query.isPending ? (
        <LoadingState label="Loading readings for this period…" />
      ) : query.isError ? (
        <ErrorState error={query.error} title="Couldn't load readings" onRetry={() => query.refetch()} />
      ) : sorted.length === 0 && !query.data.truncated ? (
        <EmptyState title="No readings in this period" description="Try a different date range." />
      ) : (
        <>
          {query.data.truncated && (
            <Alert tone="warning">
              Showing only the most recent {(HISTORY_MAX_PAGES * 1000).toLocaleString()} readings: the backend can’t
              filter by date yet, so older parts of this range may be missing from the charts. Exports include the full
              range.
            </Alert>
          )}
          {query.isFetching && <p className="text-xs text-slate-500">Updating…</p>}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Readings" value={sorted.length.toLocaleString()} />
            <StatTile label="Peak irradiance" value={formatNumber(irr?.max, 0)} unit="W/m²" />
            <StatTile
              label="Temperature"
              value={formatNumber(temp?.avg)}
              unit="°C avg"
              detail={temp ? `${formatNumber(temp.min)} – ${formatNumber(temp.max)} °C` : undefined}
            />
            <StatTile
              label="Humidity"
              value={formatNumber(hum?.avg, 0)}
              unit="% avg"
              detail={hum ? `${formatNumber(hum.min, 0)} – ${formatNumber(hum.max, 0)} %` : undefined}
            />
          </div>

          <ChartCard
            title="Irradiance (W/m²)"
            subtitle={sorted.length > 500 ? 'Averaged into time buckets for display' : undefined}
          >
            <TimeSeriesChart points={series.irradiance} label="Irradiance" unit="W/m²" decimals={0} height={280} domain={domain} />
          </ChartCard>
          <div className="grid gap-5 lg:grid-cols-2">
            <ChartCard title="Ambient temperature (°C)">
              <TimeSeriesChart points={series.temp} label="Temperature" unit="°C" domain={domain} />
            </ChartCard>
            <ChartCard title="Humidity (%)">
              <TimeSeriesChart points={series.humidity} label="Humidity" unit="%" decimals={0} domain={domain} />
            </ChartCard>
          </div>
          <p className="text-xs text-slate-500">Breaks in a line mean the device sent no data for that period.</p>

          <div>
            <Button variant="secondary" size="sm" onClick={() => setShowTable((v) => !v)} aria-expanded={showTable}>
              {showTable ? 'Hide table' : 'Show readings as a table'}
            </Button>
            {showTable && (
              <div className="mt-3">
                <ReadingsTable readings={sorted} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
