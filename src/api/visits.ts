import { api } from './client'
import type {
  ChecklistItem,
  ChecklistItemCreateRequest,
  ChecklistItemUpdateRequest,
  Visit,
  VisitCreateRequest,
  VisitSummary,
  VisitUpdateRequest,
} from './types'

const enc = encodeURIComponent

export async function listVisits(siteId: string): Promise<VisitSummary[]> {
  const { data } = await api.get<VisitSummary[]>(`/sites/${enc(siteId)}/visits`)
  return data
}

export async function createVisit(siteId: string, body: VisitCreateRequest): Promise<Visit> {
  const { data } = await api.post<Visit>(`/sites/${enc(siteId)}/visits`, body)
  return data
}

export async function getVisit(visitId: string): Promise<Visit> {
  const { data } = await api.get<Visit>(`/visits/${enc(visitId)}`)
  return data
}

export async function updateVisit(visitId: string, body: VisitUpdateRequest): Promise<Visit> {
  const { data } = await api.patch<Visit>(`/visits/${enc(visitId)}`, body)
  return data
}

export async function deleteVisit(visitId: string): Promise<void> {
  await api.delete(`/visits/${enc(visitId)}`)
}

export async function addChecklistItem(visitId: string, body: ChecklistItemCreateRequest): Promise<ChecklistItem> {
  const { data } = await api.post<ChecklistItem>(`/visits/${enc(visitId)}/items`, body)
  return data
}

export async function updateChecklistItem(
  visitId: string,
  itemId: string,
  body: ChecklistItemUpdateRequest,
): Promise<ChecklistItem> {
  const { data } = await api.patch<ChecklistItem>(`/visits/${enc(visitId)}/items/${enc(itemId)}`, body)
  return data
}

export async function deleteChecklistItem(visitId: string, itemId: string): Promise<void> {
  await api.delete(`/visits/${enc(visitId)}/items/${enc(itemId)}`)
}
