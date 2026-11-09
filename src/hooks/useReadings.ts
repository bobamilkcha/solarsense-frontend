import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listReadings, listReadingsInRange } from '../api/readings'
import { LIVE_POLL_INTERVAL_MS } from '../config'
import { queryKeys } from './queryKeys'

/** Most recent readings, re-fetched on an interval for the live view. */
export function useLiveReadings(siteId: string, limit = 1000) {
  return useQuery({
    queryKey: [...queryKeys.readings(siteId), 'live', limit],
    queryFn: () => listReadings(siteId, limit),
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
