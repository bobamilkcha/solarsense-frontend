import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { getErrorMessage } from '../../api/errors'
import type { Project, Site } from '../../api/types'
import { isAdmin } from '../../auth/roles'
import { useCurrentUser } from '../../auth/useSession'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { ConfirmDeleteDialog } from '../../components/ConfirmDeleteDialog'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States'
import { useDeleteProject, useProject, useProjectSites } from '../../hooks/useProjects'
import { formatDate } from '../../lib/format'
import { NotFoundPage } from '../NotFoundPage'
import { EditProjectDialog } from './EditProjectDialog'
import { PairDeviceDialog } from './PairDeviceDialog'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

function SiteRow({ site }: { site: Site }) {
  return (
    <li>
      <Link
        to={`/sites/${site.id}`}
        className="flex flex-col gap-1 px-5 py-4 hover:bg-amber-50/50 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{site.name}</p>
          <p className="text-xs text-slate-500">
            {site.location_lat.toFixed(5)}, {site.location_lng.toFixed(5)} · added {formatDate(site.created_at)}
          </p>
        </div>
        <span className="font-mono text-xs text-slate-600">{site.device_id ?? 'No device'}</span>
      </Link>
    </li>
  )
}

function DeleteProjectDialog({
  project,
  sites,
  open,
  onClose,
}: {
  project: Project
  sites: Site[] | undefined
  open: boolean
  onClose: () => void
}) {
  const navigate = useNavigate()
  const mutation = useDeleteProject(project.id)
  const siteCount = sites?.length ?? 0
  const pairedCount = sites?.filter((s) => s.device_id).length ?? 0

  return (
    <ConfirmDeleteDialog
      open={open}
      onClose={onClose}
      title="Delete project"
      name={project.name}
      confirmLabel="Delete project"
      pending={mutation.isPending}
      error={mutation.isError ? getErrorMessage(mutation.error) : null}
      onConfirm={() => mutation.mutate(undefined, { onSuccess: () => navigate('/projects', { replace: true }) })}
    >
      <p>
        This deletes <strong>{project.name}</strong>
        {siteCount > 0 ? (
          <>
            {' '}
            and its {siteCount === 1 ? 'site' : `${siteCount} sites`}, with all their readings, TNB bills and site
            visits.
          </>
        ) : (
          '.'
        )}
      </p>
      {sites && siteCount > 0 && (
        <ul className="list-disc pl-5 text-slate-600">
          {sites.map((s) => (
            <li key={s.id}>{s.name}</li>
          ))}
        </ul>
      )}
      {pairedCount > 0 && (
        <p>
          {pairedCount === 1 ? 'Its device is' : `${pairedCount} devices are`} unpaired and can be paired to another
          site.
        </p>
      )}
      <p>Export any data you want to keep (History tab) first.</p>
    </ConfirmDeleteDialog>
  )
}

export function ProjectDetailPage() {
  const { projectId = '' } = useParams()
  const user = useCurrentUser()
  const canPair = isAdmin(user)
  const project = useProject(projectId)
  const sites = useProjectSites(projectId)
  const [dialog, setDialog] = useState<'pair' | 'edit' | 'delete' | null>(null)
  const closeDialog = () => setDialog(null)
  useDocumentTitle(project.data?.name)

  if (project.isPending) return <LoadingState label="Loading project…" />
  if (project.isError) {
    return <ErrorState error={project.error} title="Couldn't load this project" onRetry={() => project.refetch()} />
  }
  if (!project.data) return <NotFoundPage />

  const pairButton = canPair ? <Button onClick={() => setDialog('pair')}>Add a site</Button> : null
  const headerActions = canPair ? (
    <>
      <Button variant="secondary" onClick={() => setDialog('edit')}>
        Edit
      </Button>
      <Button variant="secondary" onClick={() => setDialog('delete')}>
        Delete
      </Button>
      {pairButton}
    </>
  ) : null

  return (
    <>
      <Breadcrumbs items={[{ label: 'Projects', to: '/projects' }, { label: project.data.name }]} />
      <PageHeader
        title={project.data.name}
        description={project.data.description || `Created ${formatDate(project.data.created_at)}`}
        actions={headerActions}
      />

      <h2 className="mb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">Sites</h2>
      {sites.isPending ? (
        <LoadingState label="Loading sites…" />
      ) : sites.isError ? (
        <ErrorState error={sites.error} title="Couldn't load sites" onRetry={() => sites.refetch()} />
      ) : sites.data.length === 0 ? (
        <EmptyState
          title="No sites yet"
          description={
            canPair
              ? 'Add a site to this project, then pair a SolarSense device to it.'
              : 'Ask your company admin to add a site to this project.'
          }
          action={pairButton}
        />
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          {sites.data.map((site) => (
            <SiteRow key={site.id} site={site} />
          ))}
        </ul>
      )}

      {canPair && (
        <>
          <PairDeviceDialog projectId={projectId} open={dialog === 'pair'} onClose={closeDialog} />
          <EditProjectDialog project={project.data} open={dialog === 'edit'} onClose={closeDialog} />
          <DeleteProjectDialog
            project={project.data}
            sites={sites.data}
            open={dialog === 'delete'}
            onClose={closeDialog}
          />
        </>
      )}
    </>
  )
}
