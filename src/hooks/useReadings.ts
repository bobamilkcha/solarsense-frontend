import { useState } from 'react'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { listReadings, listReadingsInRange } from '../api/readings'
import type { SensorReading } from '../api/types'
import { LIVE_POLL_INTERVAL_MS } from '../config'
import { queryKeys } from './queryKeys'

/** Readings fetched per poll once the first full load is done. */
const POLL_PAGE_SIZE = 50
/** Cap on readings kept in memory by the live poll. */
const LIVE_KEEP = 3000

/**
 * Most recent readings for the live view. The first load fetches a full page;
 * each poll after that only asks for the newest few and merges them in, so a
 * short poll interval stays cheap. If the tab was idle long enough to miss
 * more readings than one small page holds, it falls back to a full fetch.
 */
export function useLiveReadings(siteId: string, limit = 1000) {
  const queryClient = useQueryClient()
  const queryKey = [...queryKeys.readings(siteId), 'live', limit]
  return useQuery({
    queryKey,
    queryFn: async () => {
      const previous = queryClient.getQueryData<SensorReading[]>(queryKey)
      if (!previous || previous.length === 0) return listReadings(siteId, limit)

      const newestKnown = Math.max(...previous.map((r) => Date.parse(r.device_timestamp)))
      let fresh = await listReadings(siteId, POLL_PAGE_SIZE)
      const oldestFresh = Math.min(...fresh.map((r) => Date.parse(r.device_timestamp)))
      // The small page didn't reach back to what we already have: readings were missed.
      if (fresh.length === POLL_PAGE_SIZE && oldestFresh > newestKnown) fresh = await listReadings(siteId, limit)

      const byId = new Map(previous.map((r) => [r.id, r]))
      for (const r of fresh) byId.set(r.id, r)
      return [...byId.values()]
        .sort((a, b) => Date.parse(b.device_timestamp) - Date.parse(a.device_timestamp))
        .slice(0, LIVE_KEEP)
    },
    refetchInterval: LIVE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    staleTime: 0,
  })
}

export const LIVE_MAX_HISTORY_MS = 7 * 24 * 60 * 60 * 1000

/**
 * The last 7 days, loaded once (no polling) for zooming further back than the
 * live poll reaches. Start is rounded to the hour so the query key stays stable.
 */
export function useLiveWeek(siteId: string, enabled: boolean) {
  const [{ start, end }] = useState(() => {
    const hour = 60 * 60_000
    const e = Math.ceil(Date.now() / hour) * hour
    return { end: new Date(e), start: new Date(e - LIVE_MAX_HISTORY_MS) }
  })
  return useQuery({
    queryKey: [...queryKeys.readings(siteId), 'week', start.toISOString()],
    queryFn: ({ signal }) => listReadingsInRange(siteId, start, end, HISTORY_MAX_PAGES, signal),
    enabled,
    staleTime: 5 * 60_000,
  })
}

/** Each page is 1000 readings; 20 pages covers several days of frequent data. */
export const HISTORY_MAX_PAGES = 20

export function useReadingsInRange(siteId: string, start: Date, end: Date) {
  return useQuery({
    queryKey: [...queryKeys.readings(siteId), 'range', start.toISOString(), end.toISOString()],
    queryFn: ({ signal }) => listReadingsInRange(siteId, start, end, HISTORY_MAX_PAGES, signal),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })
}
