import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listReadings, listReadingsInRange } from '../api/readings'
import { LIVE_POLL_INTERVAL_MS } from '../config'
import { queryKeys } from './queryKeys'

/** Most recent readings, re-fetched on an interval for the live view. */
export function useLiveReadings(siteId: string, limit = 500) {
  return useQuery({
    queryKey: [...queryKeys.readings(siteId), 'live', limit],
    queryFn: () => listReadings(siteId, limit),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    staleTime: 0,
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
