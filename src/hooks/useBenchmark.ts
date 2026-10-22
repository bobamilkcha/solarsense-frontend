import { useQueries, useQuery } from '@tanstack/react-query'
import { getBenchmark } from '../api/benchmark'
import { queryKeys } from './queryKeys'

const BENCHMARK_STALE_MS = 10 * 60_000

export function useBenchmark(siteId: string, month: number) {
  return useQuery({
    queryKey: queryKeys.benchmark(siteId, month),
    queryFn: () => getBenchmark(siteId, month),
    staleTime: BENCHMARK_STALE_MS,
  })
}

export const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

/** All 12 months. The API only returns one month per call. */
export function useYearBenchmark(siteId: string, enabled: boolean) {
  return useQueries({
    queries: MONTHS.map((month) => ({
      queryKey: queryKeys.benchmark(siteId, month),
      queryFn: () => getBenchmark(siteId, month),
      staleTime: BENCHMARK_STALE_MS,
      enabled,
    })),
  })
}
