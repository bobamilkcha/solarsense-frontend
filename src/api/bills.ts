import { api } from './client'
import { fetchBlob } from './download'
import type { TNBBill } from './types'

export async function listBills(siteId: string): Promise<TNBBill[]> {
  const { data } = await api.get<TNBBill[]>(`/sites/${encodeURIComponent(siteId)}/bills`)
  return data
}

/** Upload a TNB bill PDF. The backend parses it; any parsed field may come back null. */
export async function uploadBill(siteId: string, file: File): Promise<TNBBill> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<TNBBill>(`/sites/${encodeURIComponent(siteId)}/bills`, form)
  return data
}

export function fetchBillFile(billId: string): Promise<Blob> {
  return fetchBlob(`/bills/${encodeURIComponent(billId)}/file`)
}
