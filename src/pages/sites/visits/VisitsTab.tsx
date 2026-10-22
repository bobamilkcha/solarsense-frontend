import { useState } from 'react'
import { Link } from 'react-router'
import type { VisitSummary } from '../../../api/types'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/States'
import { useVisits } from '../../../hooks/useVisits'
import { formatDateTime } from '../../../lib/format'
import { useSiteContext } from '../siteContext'
import { ProgressBar } from './ProgressBar'
import { StartVisitDialog } from './StartVisitDialog'

function VisitRow({ visit }: { visit: VisitSummary }) {
  return (
    <li>
      <Link to={visit.id} className="block px-5 py-4 hover:bg-amber-50/50">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="font-medium text-slate-900">{formatDateTime(visit.visited_at)}</p>
          {visit.status === 'completed' ? <Badge tone="green">Completed</Badge> : <Badge tone="amber">In progress</Badge>}
        </div>
        <ProgressBar progress={visit.progress} />
        {visit.notes && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{visit.notes}</p>}
      </Link>
    </li>
  )
}

export function VisitsTab() {
  const { site } = useSiteContext()
  const visits = useVisits(site.id)
  const [starting, setStarting] = useState(false)
  const sorted = [...(visits.data ?? [])].sort((a, b) => b.visited_at.localeCompare(a.visited_at))
  const startButton = <Button onClick={() => setStarting(true)}>Start visit</Button>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">Run through the site checklist on each visit.</p>
        {sorted.length > 0 && startButton}
      </div>

      {visits.isPending ? (
        <LoadingState label="Loading visits…" />
      ) : visits.isError ? (
        <ErrorState error={visits.error} title="Couldn't load visits" onRetry={() => visits.refetch()} />
      ) : sorted.length === 0 ? (
        <EmptyState title="No visits yet" description="Start a visit when you're on site to work through the checklist." action={startButton} />
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          {sorted.map((visit) => (
            <VisitRow key={visit.id} visit={visit} />
          ))}
        </ul>
      )}

      <StartVisitDialog siteId={site.id} open={starting} onClose={() => setStarting(false)} />
    </div>
  )
}
