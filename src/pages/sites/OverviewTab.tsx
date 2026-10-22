import type { ReactNode } from 'react'
import { Card } from '../../components/ui/Card'
import { formatDateTime } from '../../lib/format'
import { useSiteContext } from './siteContext'

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{children}</dd>
    </div>
  )
}

export function OverviewTab() {
  const { site, project } = useSiteContext()
  const coords = `${site.location_lat.toFixed(6)}, ${site.location_lng.toFixed(6)}`
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${site.location_lat},${site.location_lng}`

  return (
    <Card>
      <h2 className="mb-4 font-semibold">Site details</h2>
      <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Detail label="Project">{project?.name ?? '—'}</Detail>
        <Detail label="Device ID">
          <span className="font-mono">{site.device_id}</span>
        </Detail>
        <Detail label="Location">
          <a href={mapUrl} target="_blank" rel="noreferrer" className="text-amber-700 hover:text-amber-600">
            {coords}
          </a>
        </Detail>
        <Detail label="Paired on">{formatDateTime(site.created_at)}</Detail>
      </dl>
    </Card>
  )
}
