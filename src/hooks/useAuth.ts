import { useMutation, useQueryClient } from '@tanstack/react-query'
import { acceptInvitation, login, logout, register } from '../api/auth'
import type { AuthResponse } from '../api/types'
import { session } from '../auth/session'

function onAuthenticated(data: AuthResponse) {
  session.signIn(data.access_token, data.user)
}

export function useLogin() {
  return useMutation({ mutationFn: login, onSuccess: onAuthenticated })
}

export function useRegister() {
  return useMutation({ mutationFn: register, onSuccess: onAuthenticated })
}

export function useAcceptInvitation() {
  return useMutation({ mutationFn: acceptInvitation, onSuccess: onAuthenticated })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logout,
    // Drop local state even if the server call fails, so the user isn't stuck logged in.
    onSettled: () => {
      session.signOut()
      queryClient.clear()
    },
  })
}
