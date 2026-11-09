import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { clearSpots, createSpot, deleteSpot, listSpots, type SurveySpotInput } from '../api/surveys'
import { queryKeys } from './queryKeys'

export function useSpots(siteId: string) {
  return useQuery({ queryKey: queryKeys.surveySpots(siteId), queryFn: () => listSpots(siteId) })
}

function useInvalidate(siteId: string) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.surveySpots(siteId) })
}

export function useCreateSpot(siteId: string) {
  const invalidate = useInvalidate(siteId)
  return useMutation({ mutationFn: (input: SurveySpotInput) => createSpot(siteId, input), onSuccess: invalidate })
}

export function useDeleteSpot(siteId: string) {
  const invalidate = useInvalidate(siteId)
  return useMutation({ mutationFn: (spotId: string) => deleteSpot(siteId, spotId), onSuccess: invalidate })
}

export function useClearSpots(siteId: string) {
  const invalidate = useInvalidate(siteId)
  return useMutation({ mutationFn: () => clearSpots(siteId), onSuccess: invalidate })
}
