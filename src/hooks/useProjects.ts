import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import {
  createProject,
  createSite,
  deleteProject,
  deleteSite,
  listProjects,
  listSites,
  listUnpairedDevices,
  pairDevice,
  unpairDevice,
  updateProject,
  updateSite,
} from '../api/projects'
import { clearSpots } from '../api/surveys'
import type { Project, ProjectUpdateRequest, Site, SiteCreateRequest, SiteUpdateRequest } from '../api/types'
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

export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: ProjectUpdateRequest) => updateProject(projectId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
  })
}

/**
 * After a delete, refresh the lists and drop the deleted sites' survey spots,
 * which only live in this browser. Not awaited, so the page can navigate away
 * before the refetch shows it as "not found".
 */
function afterSitesDeleted(queryClient: QueryClient, siteIds: string[]) {
  for (const id of siteIds) void clearSpots(id)
  void queryClient.invalidateQueries({ queryKey: queryKeys.projects })
  void queryClient.invalidateQueries({ queryKey: queryKeys.sites })
  void queryClient.invalidateQueries({ queryKey: queryKeys.unpairedDevices })
}

export function useDeleteProject(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => deleteProject(projectId),
    onSuccess: () => {
      const sites = queryClient.getQueryData<Site[]>(queryKeys.sites) ?? []
      afterSitesDeleted(
        queryClient,
        sites.filter((s) => s.project_id === projectId).map((s) => s.id),
      )
    },
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

export function useUpdateSite(siteId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: SiteUpdateRequest) => updateSite(siteId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sites })
      // Benchmark and report use the site's location.
      void queryClient.invalidateQueries({ queryKey: ['sites', siteId] })
    },
  })
}

export function useDeleteSite(siteId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => deleteSite(siteId),
    onSuccess: () => afterSitesDeleted(queryClient, [siteId]),
  })
}

/** Polls while the picker is open, since a freshly powered device appears after ~30 s. */
export function useUnpairedDevices(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.unpairedDevices,
    queryFn: listUnpairedDevices,
    enabled,
    refetchInterval: enabled ? 5_000 : false,
  })
}

export function usePairDevice(siteId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (deviceId: string) => pairDevice(siteId, deviceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sites })
      void queryClient.invalidateQueries({ queryKey: queryKeys.unpairedDevices })
    },
  })
}

export function useUnpairDevice(siteId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => unpairDevice(siteId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sites })
      void queryClient.invalidateQueries({ queryKey: queryKeys.unpairedDevices })
    },
  })
}
