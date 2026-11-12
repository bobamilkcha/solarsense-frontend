import { useState } from 'react'
import { NavLink, Outlet, useNavigate, useParams } from 'react-router'
import { getErrorMessage } from '../../api/errors'
import type { Site } from '../../api/types'
import { isAdmin } from '../../auth/roles'
import { useCurrentUser } from '../../auth/useSession'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { ConfirmDeleteDialog } from '../../components/ConfirmDeleteDialog'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { ErrorState, LoadingState } from '../../components/ui/States'
import { useDeleteSite, useProject, useSite } from '../../hooks/useProjects'
import { cn } from '../../lib/cn'
import { NotFoundPage } from '../NotFoundPage'
import { DeviceDialog } from './DeviceDialog'
import { EditSiteDialog } from './EditSiteDialog'
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

function DeleteSiteDialog({ site, open, onClose }: { site: Site; open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const mutation = useDeleteSite(site.id)

  return (
    <ConfirmDeleteDialog
      open={open}
      onClose={onClose}
      title="Delete site"
      name={site.name}
      confirmLabel="Delete site"
      pending={mutation.isPending}
      error={mutation.isError ? getErrorMessage(mutation.error) : null}
      onConfirm={() =>
        mutation.mutate(undefined, {
          onSuccess: () => navigate(`/projects/${site.project_id}`, { replace: true }),
        })
      }
    >
      <p>
        This deletes <strong>{site.name}</strong> with all its readings, TNB bills (and their PDFs), site visits and
        survey spots.
      </p>
      {site.device_id && (
        <p>
          Its device <span className="font-mono">{site.device_id}</span> is unpaired and can be paired to another site.
        </p>
      )}
      <p>Export any readings you want to keep (History tab) first.</p>
    </ConfirmDeleteDialog>
  )
}

export function SitePage() {
  const { siteId = '' } = useParams()
  const site = useSite(siteId)
  const project = useProject(site.data?.project_id ?? '')
  const canManage = isAdmin(useCurrentUser())
  const [dialog, setDialog] = useState<'device' | 'edit' | 'delete' | null>(null)
  const closeDialog = () => setDialog(null)
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
            <>
              <Button variant="secondary" onClick={() => setDialog('edit')}>
                Edit
              </Button>
              <Button variant="secondary" onClick={() => setDialog('delete')}>
                Delete
              </Button>
              <Button variant="secondary" onClick={() => setDialog('device')}>
                {site.data.device_id ? 'Change device' : 'Pair device'}
              </Button>
            </>
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
      {canManage && (
        <>
          <DeviceDialog site={site.data} open={dialog === 'device'} onClose={closeDialog} />
          <EditSiteDialog site={site.data} open={dialog === 'edit'} onClose={closeDialog} />
          <DeleteSiteDialog site={site.data} open={dialog === 'delete'} onClose={closeDialog} />
        </>
      )}
    </>
  )
}
