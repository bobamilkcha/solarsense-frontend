import { api } from './client'
import type { Benchmark } from './types'

/** Device vs satellite sunlight for one calendar month (1-12). */
export async function getBenchmark(siteId: string, month: number): Promise<Benchmark> {
  const { data } = await api.get<Benchmark>(`/sites/${encodeURIComponent(siteId)}/benchmark`, { params: { month } })
  return data
}
