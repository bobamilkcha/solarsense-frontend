import { useState } from 'react'
import { NavLink, Outlet, useParams } from 'react-router'
import { isAdmin } from '../../auth/roles'
import { useCurrentUser } from '../../auth/useSession'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { ErrorState, LoadingState } from '../../components/ui/States'
import { useProject, useSite } from '../../hooks/useProjects'
import { cn } from '../../lib/cn'
import { NotFoundPage } from '../NotFoundPage'
import { DeviceDialog } from './DeviceDialog'
import type { SiteContext } from './siteContext'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

const SITE_TABS = [
  { to: '', label: 'Overview', end: true },
  { to: 'live', label: 'Live Data', end: false },
  { to: 'history', label: 'History', end: false },
  { to: 'bills', label: 'TNB Bill', end: false },
  { to: 'benchmark', label: 'Benchmark', end: false },
  { to: 'visits', label: 'Checklist', end: false },
  { to: 'survey', label: 'Survey', end: false },
  { to: 'report', label: 'Report', end: false },
]

function tabClass({ isActive }: { isActive: boolean }) {
  return cn(
    'whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors',
    isActive ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
  )
}

export function SitePage() {
  const { siteId = '' } = useParams()
  const site = useSite(siteId)
  const project = useProject(site.data?.project_id ?? '')
  const canManage = isAdmin(useCurrentUser())
  const [deviceOpen, setDeviceOpen] = useState(false)
  useDocumentTitle(site.data?.name)

  if (site.isPending) return <LoadingState label="Loading site…" />
  if (site.isError) return <ErrorState error={site.error} title="Couldn't load this site" onRetry={() => site.refetch()} />
  if (!site.data) return <NotFoundPage />

  const context: SiteContext = { site: site.data, project: project.data ?? null }
  const projectName = project.data?.name ?? 'Project'

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Projects', to: '/projects' },
          { label: projectName, to: `/projects/${site.data.project_id}` },
          { label: site.data.name },
        ]}
      />
      <PageHeader
        title={site.data.name}
        description={
          <>
            {site.data.device_id ? (
              <>
                Device <span className="font-mono text-slate-700">{site.data.device_id}</span>
              </>
            ) : (
              'No device paired'
            )}
          </>
        }
        actions={
          canManage ? (
            <Button variant="secondary" onClick={() => setDeviceOpen(true)}>
              {site.data.device_id ? 'Change device' : 'Pair device'}
            </Button>
          ) : null
        }
      />
      <nav className="-mt-2 mb-6 flex gap-6 overflow-x-auto border-b border-slate-200" aria-label="Site sections">
        {SITE_TABS.map((tab) => (
          <NavLink key={tab.label} to={tab.to} end={tab.end} className={tabClass}>
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet context={context} />
      {canManage && <DeviceDialog site={site.data} open={deviceOpen} onClose={() => setDeviceOpen(false)} />}
    </>
  )
}
