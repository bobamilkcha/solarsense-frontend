import { useState, type FormEvent } from 'react'
import { getErrorMessage } from '../../../api/errors'
import type { Visit } from '../../../api/types'
import { Button } from '../../../components/ui/Button'
import { Select } from '../../../components/ui/Select'
import { useAddChecklistItem } from '../../../hooks/useVisits'

const NEW_CATEGORY = '__new__'

const inputClass =
  'mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none'

export function AddItemForm({ visit, categories }: { visit: Pick<Visit, 'id' | 'site_id'>; categories: string[] }) {
  const add = useAddChecklistItem(visit)
  // An empty checklist has no categories yet, so start on "new category".
  const [choice, setChoice] = useState(categories[0] ?? NEW_CATEGORY)
  const [newCategory, setNewCategory] = useState('')
  const [label, setLabel] = useState('')

  const isNew = choice === NEW_CATEGORY || !categories.includes(choice)
  const category = isNew ? newCategory.trim() : choice

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!category || !label.trim()) return
    add.mutate(
      { category, label: label.trim() },
      {
        onSuccess: () => {
          setLabel('')
          // Keep adding to the category just used, now that it exists.
          setChoice(category)
          setNewCategory('')
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h3 className="mb-3 text-sm font-semibold">Add an item</h3>
      <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
        <div className="space-y-2">
          <Select label="Category" value={isNew ? NEW_CATEGORY : choice} onChange={(e) => setChoice(e.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value={NEW_CATEGORY}>New category…</option>
          </Select>
          {isNew && (
            <input
              aria-label="New category name"
              value={newCategory}
              maxLength={100}
              autoFocus={categories.length > 0}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="e.g. Electrical"
              className={inputClass}
            />
          )}
        </div>
        <label className="text-sm font-medium text-slate-700">
          Item
          <input
            value={label}
            maxLength={300}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Check for water tank on roof"
            className={inputClass}
          />
        </label>
        <Button type="submit" loading={add.isPending} disabled={!category || !label.trim()}>
          Add
        </Button>
      </div>
      {add.isError && <p className="mt-2 text-xs text-red-600">{getErrorMessage(add.error)}</p>}
    </form>
  )
}
