import { useState, type FormEvent } from 'react'
import { getErrorMessage } from '../../../api/errors'
import type { Visit } from '../../../api/types'
import { Button } from '../../../components/ui/Button'
import { useAddChecklistItem } from '../../../hooks/useVisits'

export function AddItemForm({ visit, categories }: { visit: Pick<Visit, 'id' | 'site_id'>; categories: string[] }) {
  const add = useAddChecklistItem(visit)
  const [category, setCategory] = useState(categories[0] ?? '')
  const [label, setLabel] = useState('')
  const listId = `categories-${visit.id}`

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!category.trim() || !label.trim()) return
    add.mutate({ category: category.trim(), label: label.trim() }, { onSuccess: () => setLabel('') })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h3 className="mb-3 text-sm font-semibold">Add an item</h3>
      <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
        <label className="text-xs font-medium text-slate-600">
          Category
          <input
            list={listId}
            value={category}
            maxLength={100}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Roof"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none"
          />
          <datalist id={listId}>
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label className="text-xs font-medium text-slate-600">
          Item
          <input
            value={label}
            maxLength={300}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Check for water tank on roof"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none"
          />
        </label>
        <Button type="submit" loading={add.isPending} disabled={!category.trim() || !label.trim()}>
          Add
        </Button>
      </div>
      {add.isError && <p className="mt-2 text-xs text-red-600">{getErrorMessage(add.error)}</p>}
    </form>
  )
}
