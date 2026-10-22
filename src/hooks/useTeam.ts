import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UserUpdateRequest } from '../api/types'
import { createInvitation, listInvitations, listUsers, revokeInvitation, updateUser } from '../api/users'
import { queryKeys } from './queryKeys'

export function useUsers() {
  return useQuery({ queryKey: queryKeys.users, queryFn: listUsers })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, body }: { userId: string; body: UserUpdateRequest }) => updateUser(userId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users }),
  })
}

export function useInvitations(enabled: boolean) {
  return useQuery({ queryKey: queryKeys.invitations, queryFn: listInvitations, enabled })
}

export function useCreateInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createInvitation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.invitations }),
  })
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: revokeInvitation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.invitations }),
  })
}
