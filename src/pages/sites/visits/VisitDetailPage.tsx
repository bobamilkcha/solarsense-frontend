import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { getErrorMessage, getErrorStatus } from '../../../api/errors'
import type { ChecklistItem, Visit } from '../../../api/types'
import { Alert } from '../../../components/ui/Alert'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/States'
import { TextArea } from '../../../components/ui/TextArea'
import { useDeleteVisit, useUpdateVisit, useVisit } from '../../../hooks/useVisits'
import { formatDateTime } from '../../../lib/format'
import { NotFoundPage } from '../../NotFoundPage'
import { useSiteContext } from '../siteContext'
import { AddItemForm } from './AddItemForm'
import { ChecklistItemRow } from './ChecklistItemRow'
import { ProgressBar } from './ProgressBar'

function groupByCategory(items: ChecklistItem[]): [string, ChecklistItem[]][] {
  const groups = new Map<string, ChecklistItem[]>()
  for (const item of items) {
    const list = groups.get(item.category) ?? []
    list.push(item)
    groups.set(item.category, list)
  }
  return [...groups.entries()]
}

function VisitNotes({ visit, readOnly }: { visit: Visit; readOnly: boolean }) {
  const update = useUpdateVisit(visit)
  const [notes, setNotes] = useState(visit.notes ?? '')
  return (
    <div>
      <TextArea
        label="Visit notes"
        value={notes}
        disabled={readOnly}
        maxLength={10000}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => {
          if (notes.trim() !== (visit.notes ?? '')) update.mutate({ notes: notes.trim() })
        }}
      />
      {update.isError && <p className="mt-1 text-xs text-red-600">{getErrorMessage(update.error)}</p>}
    </div>
  )
}

function StatusActions({ visit }: { visit: Visit }) {
  const update = useUpdateVisit(visit)
  const completed = visit.status === 'completed'
  const pending = visit.progress.pending
  const errorMessage =
    getErrorStatus(update.error) === 409
      ? 'Some items are still pending. Mark every item OK, Issue or N/A first.'
      : getErrorMessage(update.error)

  return (
    <div className="flex flex-col items-stretch gap-1 sm:items-end">
      {completed ? (
        <Button variant="secondary" loading={update.isPending} onClick={() => update.mutate({ status: 'in_progress' })}>
          Reopen visit
        </Button>
      ) : (
        <Button loading={update.isPending} disabled={pending > 0} onClick={() => update.mutate({ status: 'completed' })}>
          Complete visit
        </Button>
      )}
      {!completed && pending > 0 && (
        <p className="text-xs text-slate-500">
          {pending} {pending === 1 ? 'item' : 'items'} still pending
        </p>
      )}
      {update.isError && <p className="text-xs text-red-600">{errorMessage}</p>}
    </div>
  )
}

export function VisitDetailPage() {
  const { visitId = '' } = useParams()
  const { site } = useSiteContext()
  const navigate = useNavigate()
  const visit = useVisit(visitId)
  const deleteVisit = useDeleteVisit(site.id)
  const groups = useMemo(() => groupByCategory(visit.data?.items ?? []), [visit.data?.items])

  if (visit.isPending) return <LoadingState label="Loading checklist…" />
  if (visit.isError) {
    if (getErrorStatus(visit.error) === 404) return <NotFoundPage />
    return <ErrorState error={visit.error} title="Couldn't load this visit" onRetry={() => visit.refetch()} />
  }
  if (visit.data.site_id !== site.id) return <NotFoundPage />

  const v = visit.data
  const readOnly = v.status === 'completed'

  return (
    <div className="space-y-5">
      <Link to=".." relative="path" className="text-sm text-slate-500 hover:text-amber-700">
        ← All visits
      </Link>

      <div className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">Visit on {formatDateTime(v.visited_at)}</h2>
            {readOnly ? <Badge tone="green">Completed</Badge> : <Badge tone="amber">In progress</Badge>}
          </div>
          {v.completed_at && <p className="text-xs text-slate-500">Completed {formatDateTime(v.completed_at)}</p>}
          <div className="mt-3 max-w-md">
            <ProgressBar progress={v.progress} />
          </div>
        </div>
        <StatusActions visit={v} />
      </div>

      {readOnly && <Alert tone="info">This visit is completed and locked. Reopen it to make changes.</Alert>}

      {groups.length === 0 ? (
        <EmptyState title="No checklist items" description="Add the items you want to check on this visit." />
      ) : (
        groups.map(([category, items]) => (
          <section key={category}>
            <h3 className="mb-2 text-sm font-semibold tracking-wide text-slate-500 uppercase">{category}</h3>
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
              {items.map((item) => (
                <ChecklistItemRow key={item.id} item={item} visit={v} readOnly={readOnly} />
              ))}
            </ul>
          </section>
        ))
      )}

      {!readOnly && <AddItemForm visit={v} categories={groups.map(([c]) => c)} />}

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <VisitNotes key={v.notes ?? ''} visit={v} readOnly={readOnly} />
      </div>

      <div className="flex justify-end">
        <Button
          variant="ghost"
          className="text-red-700 hover:bg-red-50"
          loading={deleteVisit.isPending}
          onClick={() => {
            if (!window.confirm('Delete this visit and its whole checklist? This can’t be undone.')) return
            deleteVisit.mutate(v.id, { onSuccess: () => navigate('..', { relative: 'path' }) })
          }}
        >
          Delete visit
        </Button>
      </div>
      {deleteVisit.isError && <Alert tone="error">{getErrorMessage(deleteVisit.error)}</Alert>}
    </div>
  )
}
