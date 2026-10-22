import { addDays, toLocalDateString } from '../../../lib/dates'
import { cn } from '../../../lib/cn'

export type DateRange = { from: string; to: string }

const PRESETS = [
  { label: 'Today', days: 1 },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
]

const inputClass =
  'mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none'

export function DateRangePicker({ value, onChange }: { value: DateRange; onChange: (range: DateRange) => void }) {
  const today = toLocalDateString(new Date())

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm font-medium text-slate-700">
          From
          <input
            type="date"
            className={inputClass}
            value={value.from}
            max={value.to || today}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          To
          <input
            type="date"
            className={inputClass}
            value={value.to}
            min={value.from}
            max={today}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
          />
        </label>
      </div>
      <div className="flex gap-1" role="group" aria-label="Quick ranges">
        {PRESETS.map((preset) => {
          const from = addDays(today, -(preset.days - 1))
          const active = value.from === from && value.to === today
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => onChange({ from, to: today })}
              aria-pressed={active}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium ring-1 ring-inset',
                active ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50',
              )}
            >
              {preset.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
