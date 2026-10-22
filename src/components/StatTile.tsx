import type { ReactNode } from 'react'
import { Card } from './ui/Card'

export function StatTile({ label, value, unit, detail }: { label: string; value: ReactNode; unit?: string; detail?: ReactNode }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums">
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-slate-500">{unit}</span>}
      </p>
      {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
    </Card>
  )
}
