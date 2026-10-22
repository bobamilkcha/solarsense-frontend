import { NavLink, Outlet, useParams } from 'react-router'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { PageHeader } from '../../components/ui/PageHeader'
import { ErrorState, LoadingState } from '../../components/ui/States'
import { useProject, useSite } from '../../hooks/useProjects'
import { cn } from '../../lib/cn'
import { NotFoundPage } from '../NotFoundPage'
import type { SiteContext } from './siteContext'

const SITE_TABS = [
  { to: '', label: 'Overview', end: true },
  { to: 'live', label: 'Live Data', end: false },
  { to: 'history', label: 'History', end: false },
  { to: 'bills', label: 'TNB Bill', end: false },
  { to: 'benchmark', label: 'Benchmark', end: false },
]

function tabClass({ isActive }: { isActive: boolean }) {
  return cn(
    'whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors',
    isActive ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
  )
}

export function SitePage() {
  const { siteId = '' } = useParams()
  const site = useSite(siteId)
  const project = useProject(site.data?.project_id ?? '')

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
            Device <span className="font-mono text-slate-700">{site.data.device_id}</span>
          </>
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
    </>
  )
}
