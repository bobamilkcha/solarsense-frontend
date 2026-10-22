import type { ReactNode } from 'react'

export type TooltipRow = { color: string; label: string; value: string }

/** Tooltip body: text in ink colors, series identity carried by the swatch only. */
export function ChartTooltipBox({ title, rows }: { title: ReactNode; rows: TooltipRow[] }) {
  return (
    <div className="rounded-lg bg-white px-3 py-2 text-xs shadow-lg ring-1 ring-slate-200">
      <p className="mb-1 font-medium text-slate-700">{title}</p>
      {rows.map((row) => (
        <p key={row.label} className="flex items-center gap-2 text-slate-600">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: row.color }} aria-hidden="true" />
          <span>{row.label}</span>
          <span className="ml-auto pl-3 font-semibold text-slate-900 tabular-nums">{row.value}</span>
        </p>
      ))}
    </div>
  )
}
