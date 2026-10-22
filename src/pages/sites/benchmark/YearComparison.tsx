import { getErrorStatus } from '../../../api/errors'
import { ChartCard } from '../../../components/charts/ChartCard'
import { CategoryBarChart } from '../../../components/charts/CategoryBarChart'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { LoadingState } from '../../../components/ui/States'
import { useYearBenchmark } from '../../../hooks/useBenchmark'
import { formatNumber } from '../../../lib/format'
import { MONTH_NAMES } from '../../../lib/months'

const SERIES = [
  { key: 'device', label: 'Device (measured)' },
  { key: 'satellite', label: 'Satellite (expected)' },
]

export function YearComparison({ siteId, enabled, onEnable }: { siteId: string; enabled: boolean; onEnable: () => void }) {
  const results = useYearBenchmark(siteId, enabled)

  if (!enabled) {
    return (
      <ChartCard title="All 12 months" subtitle="Loads one request per month from the satellite service.">
        <Button variant="secondary" onClick={onEnable}>
          Compare all months
        </Button>
      </ChartCard>
    )
  }

  const loading = results.some((r) => r.isPending)
  const failed = results.filter((r) => r.isError)
  const satelliteDown = failed.some((r) => getErrorStatus(r.error) === 502)
  const data = results.map((r, i) => ({
    category: MONTH_NAMES[i],
    device: r.data?.device_avg_daily_irradiation_kwh_m2 ?? null,
    satellite: r.data?.satellite_avg_daily_irradiation_kwh_m2 ?? null,
    ratio: r.data?.device_to_satellite_ratio ?? null,
  }))

  return (
    <ChartCard title="Daily irradiation by month (kWh/m²/day)" subtitle="Device months without a complete day show no device bar.">
      {loading ? (
        <LoadingState label="Loading all months…" />
      ) : (
        <>
          {failed.length > 0 && (
            <Alert tone="warning" className="mb-3">
              {failed.length} {failed.length === 1 ? 'month' : 'months'} couldn’t load
              {satelliteDown ? ' because satellite data is unavailable right now' : ''}.{' '}
              <button type="button" className="font-medium underline" onClick={() => failed.forEach((r) => void r.refetch())}>
                Retry
              </button>
            </Alert>
          )}
          <CategoryBarChart data={data} series={SERIES} formatValue={(v) => `${formatNumber(v, 2)} kWh/m²`} />
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-right text-xs tabular-nums">
              <thead className="text-slate-500">
                <tr>
                  <th scope="col" className="py-1 pr-3 text-left font-medium">Month</th>
                  {data.map((d) => (
                    <th key={d.category} scope="col" className="px-1.5 py-1 font-medium">{d.category}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-slate-700">
                <tr>
                  <th scope="row" className="py-1 pr-3 text-left font-normal text-slate-500">Ratio</th>
                  {data.map((d) => (
                    <td key={d.category} className="px-1.5 py-1">{formatNumber(d.ratio, 2)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </ChartCard>
  )
}
