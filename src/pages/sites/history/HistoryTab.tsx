import { useMemo, useState } from 'react'
import type { ReadingSeries } from '../../../api/types'
import { getErrorMessage, getErrorStatus } from '../../../api/errors'
import { exportReadings, type ExportFormat } from '../../../api/readings'
import { ChartCard } from '../../../components/charts/ChartCard'
import { AirTempInfo, CellTempInfo, HumidityInfo, HumidityLevelText, IrradianceInfo } from '../../../components/charts/chartInfo'
import { CELL_TEMPERATURE_BENCHMARK, IRRADIANCE_BENCHMARK } from '../../../components/charts/benchmarks'
import { TimeSeriesChart } from '../../../components/charts/TimeSeriesChart'
import { StatTile } from '../../../components/StatTile'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/States'
import { useReadingSeries } from '../../../hooks/useReadings'
import { DEFAULT_NOCT_C } from '../../../lib/cellTemp'
import { addDays, isValidDateString, localMidnightIso, startOfLocalDate, toLocalDateString } from '../../../lib/dates'
import { formatNumber } from '../../../lib/format'
import {
  airTempValues,
  bucketsToSeries,
  cellTempValues,
  formatBucket,
  humidityValues,
  irradianceValues,
  peakCellTemp,
} from '../../../lib/readingSeries'
import type { SeriesPoint } from '../../../lib/timeseries'
import { useSiteContext } from '../siteContext'
import { BucketTable } from './BucketTable'
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

/** Readable message for a failed series request; the backend's 422 texts are aimed at developers. */
function seriesErrorMessage(error: unknown): string {
  if (getErrorStatus(error) === 422) {
    const tooLong = getErrorMessage(error).toLowerCase().includes('bucket')
    return tooLong
      ? 'This date range is too long to chart. Choose a shorter range.'
      : 'This date range is not valid. Make sure the start date is on or before the end date.'
  }
  return getErrorMessage(error, "Couldn't load readings for this period.")
}

export function HistoryTab() {
  const { site } = useSiteContext()
  const [range, setRange] = useState<DateRange>(defaultRange)
  const [showTable, setShowTable] = useState(false)

  const valid = isValidDateString(range.from) && isValidDateString(range.to) && range.from <= range.to
  // Malaysian midnight of the first day to midnight after the last day (end exclusive).
  const startIso = localMidnightIso(range.from)
  const endIso = valid ? localMidnightIso(addDays(range.to, 1)) : ''
  const exportStart = useMemo(() => startOfLocalDate(range.from), [range.from])
  const exportEnd = useMemo(() => (valid ? startOfLocalDate(addDays(range.to, 1)) : new Date(NaN)), [range.to, valid])

  const query = useReadingSeries(site.id, startIso, endIso, valid)
  const data = query.data
  const series = useMemo(() => {
    if (!data) return null
    const make = (values: Parameters<typeof bucketsToSeries>[2]) => bucketsToSeries(data.buckets, data.bucket_s, values)
    return {
      irradiance: make(irradianceValues),
      cellTemp: make(cellTempValues),
      temp: make(airTempValues),
      humidity: make(humidityValues),
      peakCellTemp: peakCellTemp(data.buckets),
    }
  }, [data])

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-end sm:justify-between">
        <DateRangePicker value={range} onChange={setRange} />
        {valid && <ExportButtons siteId={site.id} siteName={site.name} start={exportStart} end={exportEnd} />}
      </div>

      {!valid ? (
        <Alert tone="error">Choose a start date on or before the end date.</Alert>
      ) : query.isPending ? (
        <LoadingState label="Loading readings for this period…" />
      ) : !data || !series ? (
        <ErrorState
          error={query.error}
          title="Couldn't load readings"
          message={seriesErrorMessage(query.error)}
          // A 422 won't fix itself on retry: the range has to change.
          onRetry={getErrorStatus(query.error) === 422 ? undefined : () => query.refetch()}
        />
      ) : data.summary.count === 0 ? (
        <EmptyState title="No readings in this period" description="The device sent no data in this date range. Try a different range." />
      ) : (
        <SeriesView
          data={data}
          series={series}
          updating={query.isFetching}
          showTable={showTable}
          onToggleTable={() => setShowTable((v) => !v)}
        />
      )}
    </div>
  )
}

type HistorySeries = {
  irradiance: SeriesPoint[]
  cellTemp: SeriesPoint[]
  temp: SeriesPoint[]
  humidity: SeriesPoint[]
  peakCellTemp: number | null
}

function SeriesView({
  data,
  series,
  updating,
  showTable,
  onToggleTable,
}: {
  data: ReadingSeries
  series: HistorySeries
  updating: boolean
  showTable: boolean
  onToggleTable: () => void
}) {
  const { summary } = data
  const domain: [number, number] = [Date.parse(data.start), Date.parse(data.end)]
  const bucketMs = data.bucket_s * 1000
  const averaged = `Each point averages ${formatBucket(data.bucket_s)}`

  return (
    <>
      {updating && <p className="text-xs text-slate-500">Updating…</p>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatTile label="Readings" value={summary.count.toLocaleString()} />
        <StatTile label="Peak irradiance" value={formatNumber(summary.irradiance_max_wm2, 0)} unit="W/m²" />
        <StatTile
          label="Air temperature"
          value={formatNumber(summary.ambient_temp_avg)}
          unit="°C avg"
          detail={`${formatNumber(summary.ambient_temp_min)} – ${formatNumber(summary.ambient_temp_max)} °C`}
        />
        <StatTile
          label="Peak cell temperature"
          value={formatNumber(series.peakCellTemp)}
          unit="°C (est.)"
          detail="From air temperature and peak irradiance"
        />
        <StatTile
          label="Humidity"
          value={formatNumber(summary.humidity_avg, 0)}
          unit="% avg"
          detail={`${formatNumber(summary.humidity_min, 0)} – ${formatNumber(summary.humidity_max, 0)} %`}
        />
      </div>

      <ChartCard title="Irradiance (W/m²)" subtitle={`${averaged}; hover for the peak`} info={<IrradianceInfo />}>
        <TimeSeriesChart points={series.irradiance} label="Irradiance" unit="W/m²" decimals={0} height={280} domain={domain} bucketMs={bucketMs} benchmark={IRRADIANCE_BENCHMARK} />
      </ChartCard>
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Estimated panel cell temperature (°C)" subtitle={`NOCT ${DEFAULT_NOCT_C} °C model`} info={<CellTempInfo />}>
          <TimeSeriesChart points={series.cellTemp} label="Cell temperature (est.)" unit="°C" domain={domain} bucketMs={bucketMs} benchmark={CELL_TEMPERATURE_BENCHMARK} />
        </ChartCard>
        <ChartCard title="Air temperature (°C)" subtitle="Line is the average; shading is the min–max range" info={<AirTempInfo />}>
          <TimeSeriesChart points={series.temp} label="Air temperature" unit="°C" domain={domain} bucketMs={bucketMs} />
        </ChartCard>
      </div>
      <ChartCard title="Humidity (%)" subtitle={<HumidityLevelText value={summary.humidity_avg} suffix="average" />} info={<HumidityInfo />}>
        <TimeSeriesChart points={series.humidity} label="Humidity" unit="%" decimals={0} domain={domain} bucketMs={bucketMs} />
      </ChartCard>
      <p className="text-xs text-slate-500">
        {averaged}; shading shows the lowest and highest reading in each period. Tap or hover the (i) on a chart for
        what it shows. Breaks in a line mean the device sent no data for that period.
      </p>

      <div>
        <Button variant="secondary" size="sm" onClick={onToggleTable} aria-expanded={showTable}>
          {showTable ? 'Hide table' : 'Show as a table'}
        </Button>
        {showTable && (
          <div className="mt-3">
            <BucketTable buckets={data.buckets} />
          </div>
        )}
      </div>
    </>
  )
}
