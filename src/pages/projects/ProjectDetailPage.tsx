import { useState } from 'react'
import { Link, useParams } from 'react-router'
import type { Site } from '../../api/types'
import { isAdmin } from '../../auth/roles'
import { useCurrentUser } from '../../auth/useSession'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States'
import { useProject, useProjectSites } from '../../hooks/useProjects'
import { formatDate } from '../../lib/format'
import { NotFoundPage } from '../NotFoundPage'
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
        <span className="font-mono text-xs text-slate-600">{site.device_id}</span>
      </Link>
    </li>
  )
}

export function ProjectDetailPage() {
  const { projectId = '' } = useParams()
  const user = useCurrentUser()
  const canPair = isAdmin(user)
  const project = useProject(projectId)
  const sites = useProjectSites(projectId)
  const [pairing, setPairing] = useState(false)
  useDocumentTitle(project.data?.name)

  if (project.isPending) return <LoadingState label="Loading project…" />
  if (project.isError) {
    return <ErrorState error={project.error} title="Couldn't load this project" onRetry={() => project.refetch()} />
  }
  if (!project.data) return <NotFoundPage />

  const pairButton = canPair ? <Button onClick={() => setPairing(true)}>Pair a device</Button> : null

  return (
    <>
      <Breadcrumbs items={[{ label: 'Projects', to: '/projects' }, { label: project.data.name }]} />
      <PageHeader
        title={project.data.name}
        description={project.data.description || `Created ${formatDate(project.data.created_at)}`}
        actions={pairButton}
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
              ? 'Pair a SolarSense device with this project. Each device gets its own site.'
              : 'Ask your company admin to pair a device with this project.'
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

      <PairDeviceDialog projectId={projectId} open={pairing} onClose={() => setPairing(false)} />
    </>
  )
}
