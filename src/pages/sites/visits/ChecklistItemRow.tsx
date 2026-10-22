import { useState } from 'react'
import { getErrorMessage } from '../../../api/errors'
import type { ChecklistItem, ChecklistItemStatus, Visit } from '../../../api/types'
import { useDeleteChecklistItem, useUpdateChecklistItem } from '../../../hooks/useVisits'
import { cn } from '../../../lib/cn'

const STATUS_OPTIONS: { status: ChecklistItemStatus; label: string; icon: string; active: string }[] = [
  { status: 'ok', label: 'OK', icon: '✓', active: 'bg-emerald-600 text-white ring-emerald-600' },
  { status: 'issue', label: 'Issue', icon: '!', active: 'bg-red-600 text-white ring-red-600' },
  { status: 'not_applicable', label: 'N/A', icon: '–', active: 'bg-slate-600 text-white ring-slate-600' },
]

type Props = { item: ChecklistItem; visit: Pick<Visit, 'id' | 'site_id'>; readOnly: boolean }

export function ChecklistItemRow({ item, visit, readOnly }: Props) {
  const update = useUpdateChecklistItem(visit)
  const remove = useDeleteChecklistItem(visit)
  const [expanded, setExpanded] = useState(Boolean(item.value || item.notes))
  const [value, setValue] = useState(item.value ?? '')
  const [notes, setNotes] = useState(item.notes ?? '')

  function setStatus(status: ChecklistItemStatus) {
    // Tapping the selected status again unticks it.
    const next = item.status === status ? 'pending' : status
    update.mutate({ itemId: item.id, body: { status: next } })
  }

  function saveField(field: 'value' | 'notes', text: string) {
    const current = item[field] ?? ''
    if (text.trim() === current) return
    // Empty string clears the field (null would mean "leave unchanged").
    update.mutate({ itemId: item.id, body: { [field]: text.trim() } })
  }

  const error = update.error ?? remove.error

  return (
    <li className="px-4 py-3 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900">{item.label}</p>
          {!expanded && (item.value || item.notes) && (
            <p className="truncate text-xs text-slate-500">{[item.value, item.notes].filter(Boolean).join(' · ')}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5" role="group" aria-label={`Status for ${item.label}`}>
          {STATUS_OPTIONS.map((option) => {
            const active = item.status === option.status
            return (
              <button
                key={option.status}
                type="button"
                disabled={readOnly}
                aria-pressed={active}
                onClick={() => setStatus(option.status)}
                className={cn(
                  'inline-flex min-h-11 min-w-16 items-center justify-center gap-1 rounded-lg px-3 text-sm font-medium ring-1 ring-inset transition-colors disabled:cursor-not-allowed',
                  active ? option.active : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50 disabled:opacity-60',
                )}
              >
                <span aria-hidden="true">{option.icon}</span>
                {option.label}
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Hide details' : 'Add value or notes'}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <svg className={cn('h-5 w-5 transition-transform', expanded && 'rotate-180')} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z" />
            </svg>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
          <label className="text-xs font-medium text-slate-600">
            Value
            <input
              value={value}
              disabled={readOnly}
              maxLength={300}
              placeholder="e.g. 45 m²"
              onChange={(e) => setValue(e.target.value)}
              onBlur={() => saveField('value', value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none disabled:bg-slate-50"
            />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Notes
            <input
              value={notes}
              disabled={readOnly}
              maxLength={10000}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => saveField('notes', notes)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none disabled:bg-slate-50"
            />
          </label>
          {!readOnly && (
            <button
              type="button"
              disabled={remove.isPending}
              onClick={() => {
                if (window.confirm(`Remove “${item.label}” from this checklist?`)) remove.mutate(item.id)
              }}
              className="min-h-10 rounded-lg px-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              Remove item
            </button>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{getErrorMessage(error, "Couldn't save that change.")}</p>}
    </li>
  )
}
