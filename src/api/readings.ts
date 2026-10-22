import { api } from './client'
import { downloadFile } from './download'
import type { SensorReading } from './types'

export const READINGS_PAGE_LIMIT = 1000

/** Newest first. */
export async function listReadings(siteId: string, limit: number, offset = 0): Promise<SensorReading[]> {
  const { data } = await api.get<SensorReading[]>(`/sites/${encodeURIComponent(siteId)}/readings`, {
    params: { limit: Math.min(limit, READINGS_PAGE_LIMIT), offset },
  })
  return data
}

export type ReadingsRange = {
  readings: SensorReading[]
  /** True when we stopped paging before reaching the start of the range. */
  truncated: boolean
}

/**
 * The list endpoint has no date filter, only limit/offset (newest first).
 * Page backwards until a whole page is older than `start`, then filter.
 */
export async function listReadingsInRange(
  siteId: string,
  start: Date,
  end: Date,
  maxPages: number,
  signal?: AbortSignal,
): Promise<ReadingsRange> {
  const startMs = start.getTime()
  const endMs = end.getTime()
  const collected: SensorReading[] = []

  for (let page = 0; page < maxPages; page++) {
    const { data } = await api.get<SensorReading[]>(`/sites/${encodeURIComponent(siteId)}/readings`, {
      params: { limit: READINGS_PAGE_LIMIT, offset: page * READINGS_PAGE_LIMIT },
      signal,
    })
    let newestInPage = -Infinity
    for (const reading of data) {
      const t = Date.parse(reading.device_timestamp)
      newestInPage = Math.max(newestInPage, t)
      if (t >= startMs && t < endMs) collected.push(reading)
    }
    const reachedEnd = data.length < READINGS_PAGE_LIMIT
    const pastStart = newestInPage < startMs
    if (reachedEnd || pastStart) return { readings: collected, truncated: false }
  }
  return { readings: collected, truncated: true }
}

export type ExportFormat = 'csv' | 'xlsx'

export function exportReadings(siteId: string, format: ExportFormat, start: Date, end: Date, siteName: string) {
  const safeName = siteName.replace(/[^a-z0-9-_]+/gi, '_')
  return downloadFile(
    `/sites/${encodeURIComponent(siteId)}/readings/export`,
    { format, start: start.toISOString(), end: end.toISOString() },
    `${safeName}_readings.${format}`,
  )
}
