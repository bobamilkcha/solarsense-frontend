import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getFeasibility, type FeasibilityParams } from '../api/feasibility'
import { queryKeys } from './queryKeys'

export function useFeasibility(siteId: string, params: FeasibilityParams) {
  return useQuery({
    queryKey: queryKeys.feasibility(siteId, params),
    queryFn: () => getFeasibility(siteId, params),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  })
}
