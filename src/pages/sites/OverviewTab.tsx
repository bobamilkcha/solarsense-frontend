import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import { useBills } from '../../hooks/useBills'
import { useNow } from '../../hooks/useNow'
import { useLiveReadings } from '../../hooks/useReadings'
import { useVisits } from '../../hooks/useVisits'
import { formatDateTime, formatNumber, formatRelative } from '../../lib/format'
import { useSiteContext } from './siteContext'

const STALE_AFTER_MS = 15 * 60_000

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{children}</dd>
    </div>
  )
}

function SummaryCard({ title, to, linkLabel, children }: { title: string; to: string; linkLabel: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-2 flex-1 text-sm text-slate-600">{children}</div>
      <Link to={to} className="mt-4 text-sm font-medium text-amber-700 hover:text-amber-600">
        {linkLabel} →
      </Link>
    </Card>
  )
}

function Unavailable() {
  return <span className="text-slate-400">Couldn’t load</span>
}

function DeviceSummary({ siteId }: { siteId: string }) {
  const readings = useLiveReadings(siteId, 1)
  const now = useNow()
  const latest = readings.data?.[0]
  if (readings.isPending) return <Spinner />
  if (readings.isError) return <Unavailable />
  if (!latest) return <p>No readings received yet.</p>
  const stale = now - Date.parse(latest.device_timestamp) > STALE_AFTER_MS
  return (
    <>
      <p className="flex items-center gap-2">
        {stale ? <Badge tone="neutral">Quiet</Badge> : <Badge tone="green">Reporting</Badge>}
        <span>Last reading {formatRelative(latest.device_timestamp, now)}</span>
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
        {formatNumber(latest.irradiance_wm2, 0)} <span className="text-sm font-normal text-slate-500">W/m²</span>
      </p>
      <p className="text-xs text-slate-500">
        {formatNumber(latest.ambient_temp)} °C · {formatNumber(latest.humidity, 0)}% humidity
      </p>
    </>
  )
}

function BillsSummary({ siteId }: { siteId: string }) {
  const bills = useBills(siteId)
  if (bills.isPending) return <Spinner />
  if (bills.isError) return <Unavailable />
  const withKwh = bills.data.filter((b) => b.kwh_used !== null)
  if (bills.data.length === 0) return <p>No bills uploaded. The report needs at least one.</p>
  const avg = withKwh.length ? withKwh.reduce((sum, b) => sum + (b.kwh_used ?? 0), 0) / withKwh.length : null
  return (
    <>
      <p>
        {bills.data.length} {bills.data.length === 1 ? 'bill' : 'bills'} uploaded
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
        {formatNumber(avg, 0)} <span className="text-sm font-normal text-slate-500">kWh / month</span>
      </p>
    </>
  )
}

function VisitsSummary({ siteId }: { siteId: string }) {
  const visits = useVisits(siteId)
  if (visits.isPending) return <Spinner />
  if (visits.isError) return <Unavailable />
  if (visits.data.length === 0) return <p>No site visits yet.</p>
  const latest = [...visits.data].sort((a, b) => b.visited_at.localeCompare(a.visited_at))[0]
  return (
    <>
      <p className="flex flex-wrap items-center gap-2">
        Latest: {formatDateTime(latest.visited_at)}
        {latest.status === 'completed' ? <Badge tone="green">Completed</Badge> : <Badge tone="amber">In progress</Badge>}
      </p>
      <p className="mt-2 text-xs text-slate-500">
        {latest.progress.total - latest.progress.pending}/{latest.progress.total} checked · {latest.progress.issue}{' '}
        {latest.progress.issue === 1 ? 'issue' : 'issues'}
      </p>
    </>
  )
}

export function OverviewTab() {
  const { site, project } = useSiteContext()
  const coords = `${site.location_lat.toFixed(6)}, ${site.location_lng.toFixed(6)}`
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${site.location_lat},${site.location_lng}`

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard title="Device" to="live" linkLabel="Live data">
          <DeviceSummary siteId={site.id} />
        </SummaryCard>
        <SummaryCard title="TNB bills" to="bills" linkLabel="Bills">
          <BillsSummary siteId={site.id} />
        </SummaryCard>
        <SummaryCard title="Site visits" to="visits" linkLabel="Checklist">
          <VisitsSummary siteId={site.id} />
        </SummaryCard>
      </div>

      <Card>
        <h2 className="mb-4 font-semibold">Site details</h2>
        <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Detail label="Project">{project?.name ?? '—'}</Detail>
          <Detail label="Device ID">
            <span className="font-mono break-all">{site.device_id ?? 'Not paired'}</span>
          </Detail>
          <Detail label="Location">
            <a href={mapUrl} target="_blank" rel="noreferrer" className="text-amber-700 hover:text-amber-600">
              {coords}
            </a>
          </Detail>
          <Detail label="Paired on">{formatDateTime(site.created_at)}</Detail>
        </dl>
      </Card>

      <Link
        to="report"
        className="flex items-center justify-between rounded-xl bg-slate-900 px-5 py-4 text-white hover:bg-slate-800"
      >
        <span>
          <span className="block font-semibold">Feasibility report</span>
          <span className="block text-sm text-slate-300">System size, cost, savings and payback for this site</span>
        </span>
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  )
}
