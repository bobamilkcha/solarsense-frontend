import type { ReactNode } from 'react'
import { Card } from '../ui/Card'
import { InfoPopover } from '../ui/InfoPopover'

type ChartCardProps = {
  title: string
  subtitle?: ReactNode
  children: ReactNode
  actions?: ReactNode
  /** Explanation shown from an (i) button next to the title. */
  info?: ReactNode
}

export function ChartCard({ title, subtitle, children, actions, info }: ChartCardProps) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        {(actions || info) && (
          <div className="flex items-start gap-1">
            {actions}
            {info && (
              <div className="-mt-1.5 -mr-1.5">
                <InfoPopover title={title}>{info}</InfoPopover>
              </div>
            )}
          </div>
        )}
      </div>
      {children}
    </Card>
  )
}
