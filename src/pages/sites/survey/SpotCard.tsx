import type { ReactNode } from 'react'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { formatNumber } from '../../../lib/format'
import { CRITERION_LABELS, scoreColor, type Criterion, type ScoredSpot } from '../../../lib/survey'

const STATUS_BADGE: Record<ScoredSpot['status'], ReactNode> = {
  recording: <Badge tone="blue">Measuring</Badge>,
  waiting: <Badge tone="neutral">Waiting for readings</Badge>,
  unstable: <Badge tone="amber">Unstable sky, re-record</Badge>,
  ready: null,
}

type Props = { item: ScoredSpot; onRecheck: () => void; onDelete: () => void; deleting: boolean }

export function SpotCard({ item, onRecheck, onDelete, deleting }: Props) {
  const { spot, stats, status, score, rank, parts, drift } = item
  return (
    <li className="p-4 sm:px-5">
      <div className="flex items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white"
          style={{ backgroundColor: scoreColor(score) }}
          aria-label={score === null ? 'No score yet' : `Score ${score}`}
        >
          {score ?? '…'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium text-slate-900">{spot.label}</h3>
            {rank === 1 && <Badge tone="green">Best spot</Badge>}
            {rank !== null && rank > 1 && <Badge>#{rank}</Badge>}
            {STATUS_BADGE[status]}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {stats.count} {stats.count === 1 ? 'reading' : 'readings'}
            {spot.accuracy_m !== null && ` · GPS ±${Math.round(spot.accuracy_m)} m`}
          </p>
          {status !== 'recording' && stats.count > 0 && (
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
              <Stat label="Irradiance" value={`${formatNumber(stats.irradiance, 0)} W/m²`} />
              <Stat label="Temp" value={`${formatNumber(stats.temp)} °C`} />
              <Stat label="Humidity" value={`${formatNumber(stats.humidity, 0)} %`} />
              <Stat label="Tilt" value={`${formatNumber(stats.tilt, 0)}°`} />
            </dl>
          )}
          {score !== null && (
            <p className="mt-2 text-xs text-slate-500">
              {(Object.keys(parts) as Criterion[])
                .map((c) => `${CRITERION_LABELS[c]} ${Math.round((parts[c] ?? 0) * 100)}%`)
                .join(' · ')}
            </p>
          )}
          {drift !== null && (
            <p className={`mt-1 text-xs ${Math.abs(drift) > 0.15 ? 'text-amber-700' : 'text-slate-500'}`}>
              Re-check: irradiance {drift >= 0 ? '+' : ''}
              {Math.round(drift * 100)}% since this reading
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={onRecheck} disabled={status === 'recording'}>
          Re-check this spot
        </Button>
        <Button variant="ghost" size="sm" className="text-red-700 hover:bg-red-50" loading={deleting} onClick={onDelete}>
          Delete
        </Button>
      </div>
    </li>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="tabular-nums text-slate-900">{value}</dd>
    </div>
  )
}
