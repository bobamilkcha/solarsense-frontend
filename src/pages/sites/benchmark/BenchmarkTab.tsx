import { useState } from 'react'
import { getErrorStatus } from '../../../api/errors'
import { ChartCard } from '../../../components/charts/ChartCard'
import { CategoryBarChart } from '../../../components/charts/CategoryBarChart'
import { Alert } from '../../../components/ui/Alert'
import { Select } from '../../../components/ui/Select'
import { ErrorState, LoadingState } from '../../../components/ui/States'
import { MONTHS, useBenchmark } from '../../../hooks/useBenchmark'
import { formatNumber } from '../../../lib/format'
import { MONTH_LONG_NAMES, currentMonth } from '../../../lib/months'
import { useSiteContext } from '../siteContext'
import { BenchmarkTable } from './BenchmarkTable'
import { RatioHeadline } from './RatioHeadline'
import { YearComparison } from './YearComparison'

export function BenchmarkTab() {
  const { site } = useSiteContext()
  const [month, setMonth] = useState(currentMonth)
  const [showYear, setShowYear] = useState(false)
  const benchmark = useBenchmark(site.id, month)

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-2xl text-sm text-slate-600">
          Compares the sunlight this device measured with what satellite data expects for this location. A low ratio
          suggests shading.
        </p>
        <Select label="Month" value={month} onChange={(e) => setMonth(Number(e.target.value))} className="sm:w-48">
          {MONTHS.map((m) => (
            <option key={m} value={m}>
              {MONTH_LONG_NAMES[m - 1]}
            </option>
          ))}
        </Select>
      </div>

      {benchmark.isPending ? (
        <LoadingState label="Loading benchmark…" />
      ) : benchmark.isError ? (
        <ErrorState
          error={benchmark.error}
          title={getErrorStatus(benchmark.error) === 502 ? 'Satellite data unavailable' : "Couldn't load the benchmark"}
          onRetry={() => benchmark.refetch()}
        />
      ) : (
        <>
          <RatioHeadline benchmark={benchmark.data} />
          <div className="grid gap-5 lg:grid-cols-2">
            <ChartCard title={`Average daily irradiation, ${MONTH_LONG_NAMES[month - 1]}`} subtitle="kWh/m² per day">
              {benchmark.data.device_avg_daily_irradiation_kwh_m2 === null && (
                <Alert tone="info" className="mb-3">
                  No device value yet: needs at least one complete day.
                </Alert>
              )}
              <CategoryBarChart
                height={220}
                data={[
                  { category: 'Device (measured)', value: benchmark.data.device_avg_daily_irradiation_kwh_m2 },
                  { category: `Satellite (${benchmark.data.satellite_source})`, value: benchmark.data.satellite_avg_daily_irradiation_kwh_m2 },
                ]}
                series={[{ key: 'value', label: 'Daily irradiation' }]}
                formatValue={(v) => `${formatNumber(v, 2)} kWh/m²`}
              />
            </ChartCard>
            <BenchmarkTable benchmark={benchmark.data} />
          </div>
          <p className="text-xs text-slate-500">
            Device irradiance calibration is still approximate, so treat small differences with care. Satellite data:{' '}
            {benchmark.data.satellite_source}.
          </p>
        </>
      )}

      <YearComparison siteId={site.id} enabled={showYear} onEnable={() => setShowYear(true)} />
    </div>
  )
}
