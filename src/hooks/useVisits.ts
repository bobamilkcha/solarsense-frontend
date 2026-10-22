import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ChecklistItem, ChecklistItemUpdateRequest, Visit, VisitCreateRequest, VisitUpdateRequest } from '../api/types'
import {
  addChecklistItem,
  createVisit,
  deleteChecklistItem,
  deleteVisit,
  getVisit,
  listVisits,
  updateChecklistItem,
  updateVisit,
} from '../api/visits'
import { queryKeys } from './queryKeys'

function progressOf(items: ChecklistItem[]): Visit['progress'] {
  const progress = { total: items.length, pending: 0, ok: 0, issue: 0, not_applicable: 0 }
  for (const item of items) progress[item.status] += 1
  return progress
}

function withItems(visit: Visit, items: ChecklistItem[]): Visit {
  const sorted = [...items].sort((a, b) => a.position - b.position)
  return { ...visit, items: sorted, progress: progressOf(sorted) }
}

export function useVisits(siteId: string) {
  return useQuery({ queryKey: queryKeys.visits(siteId), queryFn: () => listVisits(siteId) })
}

export function useVisit(visitId: string) {
  return useQuery({ queryKey: queryKeys.visit(visitId), queryFn: () => getVisit(visitId) })
}

export function useCreateVisit(siteId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: VisitCreateRequest) => createVisit(siteId, body),
    onSuccess: (visit) => {
      queryClient.setQueryData(queryKeys.visit(visit.id), visit)
      void queryClient.invalidateQueries({ queryKey: queryKeys.visits(siteId) })
    },
  })
}

export function useUpdateVisit(visit: Pick<Visit, 'id' | 'site_id'>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: VisitUpdateRequest) => updateVisit(visit.id, body),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.visit(visit.id), updated)
      void queryClient.invalidateQueries({ queryKey: queryKeys.visits(visit.site_id) })
    },
  })
}

export function useDeleteVisit(siteId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteVisit,
    onSuccess: (_data, visitId) => {
      queryClient.removeQueries({ queryKey: queryKeys.visit(visitId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.visits(siteId) })
    },
  })
}

/** Optimistic: the tick shows immediately on a rooftop with patchy signal, and rolls back on error. */
export function useUpdateChecklistItem(visit: Pick<Visit, 'id' | 'site_id'>) {
  const queryClient = useQueryClient()
  const key = queryKeys.visit(visit.id)
  return useMutation({
    mutationFn: ({ itemId, body }: { itemId: string; body: ChecklistItemUpdateRequest }) =>
      updateChecklistItem(visit.id, itemId, body),
    onMutate: async ({ itemId, body }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Visit>(key)
      if (previous) {
        const items = previous.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                ...(body.status != null && { status: body.status }),
                ...(body.value != null && { value: body.value }),
                ...(body.notes != null && { notes: body.notes }),
              }
            : item,
        )
        queryClient.setQueryData(key, withItems(previous, items))
      }
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
    onSuccess: (item) => {
      const current = queryClient.getQueryData<Visit>(key)
      if (current) queryClient.setQueryData(key, withItems(current, current.items.map((i) => (i.id === item.id ? item : i))))
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.visits(visit.site_id) }),
  })
}

export function useAddChecklistItem(visit: Pick<Visit, 'id' | 'site_id'>) {
  const queryClient = useQueryClient()
  const key = queryKeys.visit(visit.id)
  return useMutation({
    mutationFn: (body: { category: string; label: string }) => addChecklistItem(visit.id, body),
    onSuccess: (item) => {
      const current = queryClient.getQueryData<Visit>(key)
      if (current) queryClient.setQueryData(key, withItems(current, [...current.items, item]))
      void queryClient.invalidateQueries({ queryKey: queryKeys.visits(visit.site_id) })
    },
  })
}

export function useDeleteChecklistItem(visit: Pick<Visit, 'id' | 'site_id'>) {
  const queryClient = useQueryClient()
  const key = queryKeys.visit(visit.id)
  return useMutation({
    mutationFn: (itemId: string) => deleteChecklistItem(visit.id, itemId),
    onSuccess: (_data, itemId) => {
      const current = queryClient.getQueryData<Visit>(key)
      if (current) queryClient.setQueryData(key, withItems(current, current.items.filter((i) => i.id !== itemId)))
      void queryClient.invalidateQueries({ queryKey: queryKeys.visits(visit.site_id) })
    },
  })
}
