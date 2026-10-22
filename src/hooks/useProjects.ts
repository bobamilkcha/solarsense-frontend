import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createProject, createSite, listProjects, listSites } from '../api/projects'
import type { Project, Site, SiteCreateRequest } from '../api/types'
import { queryKeys } from './queryKeys'

export function useProjects() {
  return useQuery({ queryKey: queryKeys.projects, queryFn: listProjects })
}

/** No single-project endpoint exists, so read it from the list. */
export function useProject(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: listProjects,
    select: (projects: Project[]) => projects.find((p) => p.id === projectId) ?? null,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
  })
}

export function useSites() {
  return useQuery({ queryKey: queryKeys.sites, queryFn: listSites })
}

export function useProjectSites(projectId: string) {
  return useQuery({
    queryKey: queryKeys.sites,
    queryFn: listSites,
    select: (sites: Site[]) => sites.filter((s) => s.project_id === projectId),
  })
}

/** No single-site endpoint exists, so read it from the list. */
export function useSite(siteId: string) {
  return useQuery({
    queryKey: queryKeys.sites,
    queryFn: listSites,
    select: (sites: Site[]) => sites.find((s) => s.id === siteId) ?? null,
  })
}

export function useCreateSite(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: SiteCreateRequest) => createSite(projectId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.sites }),
  })
}
