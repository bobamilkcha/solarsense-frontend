import { api } from './client'
import type { Project, ProjectCreateRequest, Site, SiteCreateRequest, UnpairedDevice } from './types'

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

/** Devices that are online but not on any site, for the pairing picker. */
export async function listUnpairedDevices(): Promise<UnpairedDevice[]> {
  const { data } = await api.get<UnpairedDevice[]>('/devices/unpaired')
  return data
}

/** Pair a device to a site. Replaces the site's current device, if any. */
export async function pairDevice(siteId: string, deviceId: string): Promise<Site> {
  const { data } = await api.put<Site>(`/sites/${encodeURIComponent(siteId)}/device`, { device_id: deviceId })
  return data
}

/** Release the site's device so it can be moved. Past readings stay on the site. */
export async function unpairDevice(siteId: string): Promise<Site> {
  const { data } = await api.delete<Site>(`/sites/${encodeURIComponent(siteId)}/device`)
  return data
}
