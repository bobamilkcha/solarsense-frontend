import { api } from './client'
import { downloadFile } from './download'
import type { FeasibilityReport } from './types'

/** Optional overrides; anything left undefined uses the backend default. */
export type FeasibilityParams = {
  system_kwp?: number
  performance_ratio?: number
  self_consumption_ratio?: number
  export_rate_rm_per_kwh?: number
  cost_per_kwp_rm?: number
  panel_wp?: number
  afa_rate_rm_per_kwh?: number
}

export async function getFeasibility(siteId: string, params: FeasibilityParams): Promise<FeasibilityReport> {
  const { data } = await api.get<FeasibilityReport>(`/sites/${encodeURIComponent(siteId)}/feasibility`, { params })
  return data
}

export function downloadFeasibilityXlsx(siteId: string, params: FeasibilityParams, siteName: string) {
  const safeName = siteName.replace(/[^a-z0-9-_]+/gi, '_')
  return downloadFile(
    `/sites/${encodeURIComponent(siteId)}/feasibility/xlsx`,
    params,
    `${safeName}_feasibility.xlsx`,
  )
}
