import { api } from './client'
import type { Project, ProjectCreateRequest, Site, SiteCreateRequest } from './types'

export async function listProjects(): Promise<Project[]> {
  const { data } = await api.get<Project[]>('/projects')
  return data
}

export async function createProject(body: ProjectCreateRequest): Promise<Project> {
  const { data } = await api.post<Project>('/projects', body)
  return data
}

export async function listSites(): Promise<Site[]> {
  const { data } = await api.get<Site[]>('/sites')
  return data
}

/** Create a site and pair it with a physical device via its device_id. */
export async function createSite(projectId: string, body: SiteCreateRequest): Promise<Site> {
  const { data } = await api.post<Site>(`/projects/${encodeURIComponent(projectId)}/sites`, body)
  return data
}
