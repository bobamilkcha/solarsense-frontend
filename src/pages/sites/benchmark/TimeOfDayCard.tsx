import type { SameDayBenchmark, SameDayPeriod } from '../../../api/types'
import { ChartCard } from '../../../components/charts/ChartCard'
import { CategoryBarChart } from '../../../components/charts/CategoryBarChart'
import { cn } from '../../../lib/cn'
import { formatNumber } from '../../../lib/format'
import { SHADING_COPY, shadingLevel } from './shading'

const PERIOD_LABEL: Record<SameDayPeriod['period'], string> = {
  morning: 'Morning',
  midday: 'Midday',
  afternoon: 'Afternoon',
}

const LEVEL_TEXT = {
  good: 'text-emerald-700',
  some: 'text-amber-700',
  heavy: 'text-red-700',
} as const

function hours(p: SameDayPeriod) {
  const pad = (h: number) => `${String(h).padStart(2, '0')}:00`
  return `${pad(p.start_hour)}–${pad(p.end_hour)}`
}

/** When in the day the site loses sunlight: same-hour device vs satellite, per period. */
export function TimeOfDayCard({ sameDay }: { sameDay: SameDayBenchmark }) {
  const data = sameDay.periods.map((p) => ({
    category: `${PERIOD_LABEL[p.period]} ${hours(p)}`,
    device: p.hours ? p.device_kwh_m2 : null,
    satellite: p.hours ? p.satellite_kwh_m2 : null,
  }))

  return (
    <ChartCard
      title="When is the site shaded?"
      subtitle="Sunlight over the matched hours, device vs satellite for the same hours (kWh/m²)"
    >
      <CategoryBarChart
        height={220}
        data={data}
        series={[
          { key: 'device', label: 'Device (measured)' },
          { key: 'satellite', label: 'Satellite (same hours)' },
        ]}
        formatValue={(v) => `${formatNumber(v, 2)} kWh/m²`}
      />
      <ul className="mt-4 divide-y divide-slate-100 text-sm">
        {sameDay.periods.map((p) => {
          const level = p.ratio === null ? null : shadingLevel(p.ratio)
          return (
            <li key={p.period} className="flex items-baseline justify-between gap-3 py-2">
              <span className="text-slate-600">
                {PERIOD_LABEL[p.period]} <span className="text-xs text-slate-400">{hours(p)}</span>
              </span>
              <span className="text-right">
                <span className={cn('font-semibold tabular-nums', level ? LEVEL_TEXT[level] : 'text-slate-400')}>
                  {p.ratio === null ? 'Not enough data' : formatNumber(p.ratio, 2)}
                </span>
                {level && <span className="ml-2 text-xs text-slate-500">{SHADING_COPY[level].label}</span>}
                <span className="block text-xs text-slate-400">{p.hours === 1 ? '1 hour' : `${p.hours} hours`} measured</span>
              </span>
            </li>
          )
        })}
      </ul>
      <p className="mt-2 text-xs text-slate-500">
        A low ratio in one period points to an obstruction on that side: morning = east, afternoon = west.
      </p>
    </ChartCard>
  )
}
