import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { Project, Site } from '../../api/types'
import { isAdmin } from '../../auth/roles'
import { useCurrentUser } from '../../auth/useSession'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States'
import { useProjects, useSites } from '../../hooks/useProjects'
import { formatDate } from '../../lib/format'
import { CreateProjectDialog } from './CreateProjectDialog'

function ProjectCard({ project, siteCount }: { project: Project; siteCount: number | null }) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="group flex flex-col rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md hover:ring-amber-300"
    >
      <h2 className="truncate font-semibold text-slate-900 group-hover:text-amber-700">{project.name}</h2>
      <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-slate-500">
        {project.description || 'No description'}
      </p>
      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span>
          {siteCount === null ? '…' : siteCount} {siteCount === 1 ? 'site' : 'sites'}
        </span>
        <span>Created {formatDate(project.created_at)}</span>
      </div>
    </Link>
  )
}

function countSitesByProject(sites: Site[] | undefined): Map<string, number> | null {
  if (!sites) return null
  const counts = new Map<string, number>()
  for (const site of sites) counts.set(site.project_id, (counts.get(site.project_id) ?? 0) + 1)
  return counts
}

export function ProjectsPage() {
  const user = useCurrentUser()
  const canCreate = isAdmin(user)
  const projects = useProjects()
  const sites = useSites()
  const [creating, setCreating] = useState(false)
  const siteCounts = useMemo(() => countSitesByProject(sites.data), [sites.data])

  const sorted = useMemo(
    () => [...(projects.data ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [projects.data],
  )

  const newButton = canCreate ? <Button onClick={() => setCreating(true)}>New project</Button> : null

  return (
    <>
      <PageHeader title="Projects" description="Each project groups one or more customer sites." actions={newButton} />

      {projects.isPending ? (
        <LoadingState label="Loading projects…" />
      ) : projects.isError ? (
        <ErrorState error={projects.error} title="Couldn't load projects" onRetry={() => projects.refetch()} />
      ) : sorted.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description={
            canCreate
              ? 'Create a project for a customer, then pair a SolarSense device to one of its sites.'
              : 'Your company admin hasn’t created any projects yet.'
          }
          action={newButton}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              siteCount={siteCounts ? (siteCounts.get(project.id) ?? 0) : null}
            />
          ))}
        </div>
      )}

      <CreateProjectDialog open={creating} onClose={() => setCreating(false)} />
    </>
  )
}
