import type { Benchmark } from '../../../api/types'
import { Card } from '../../../components/ui/Card'
import { cn } from '../../../lib/cn'
import { formatNumber } from '../../../lib/format'
import { SHADING_COPY, shadingLevel, type ShadingLevel } from './shading'

const LEVEL_STYLE: Record<ShadingLevel, { badge: string; icon: string }> = {
  good: { badge: 'bg-emerald-100 text-emerald-800', icon: '✓' },
  some: { badge: 'bg-amber-100 text-amber-900', icon: '!' },
  heavy: { badge: 'bg-red-100 text-red-800', icon: '✕' },
}

export function RatioHeadline({ benchmark }: { benchmark: Benchmark }) {
  const ratio = benchmark.device_to_satellite_ratio

  if (benchmark.device_complete_days === 0 || ratio === null) {
    return (
      <Card>
        <p className="text-sm font-medium text-slate-500">Device-to-satellite ratio</p>
        <p className="mt-2 text-3xl font-semibold text-slate-400">Collecting data</p>
        <p className="mt-2 max-w-xl text-sm text-slate-600">
          The device hasn’t recorded a complete day this month yet (at least 90% of 07:00–19:00 covered). The
          comparison appears after the first full day. {benchmark.device_reading_count.toLocaleString()} readings so far.
        </p>
      </Card>
    )
  }

  const level = shadingLevel(ratio)
  const copy = SHADING_COPY[level]
  return (
    <Card>
      <p className="text-sm font-medium text-slate-500">Device-to-satellite ratio</p>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <p className="text-5xl font-semibold text-slate-900 tabular-nums">{formatNumber(ratio, 2)}</p>
        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium', LEVEL_STYLE[level].badge)}>
          <span aria-hidden="true">{LEVEL_STYLE[level].icon}</span>
          {copy.label}
        </span>
      </div>
      <p className="mt-2 max-w-xl text-sm text-slate-600">
        {copy.detail} 1.00 = exactly as predicted. Based on {benchmark.device_complete_days} complete{' '}
        {benchmark.device_complete_days === 1 ? 'day' : 'days'} of device data.
      </p>
    </Card>
  )
}
