import { useSyncExternalStore } from 'react'
import { session, type SessionState } from './session'

export function useSession(): SessionState {
  return useSyncExternalStore(session.subscribe, session.get)
}

/** The logged-in user. Only call inside routes wrapped by ProtectedRoute. */
export function useCurrentUser() {
  const state = useSession()
  if (state.status !== 'authenticated') {
    throw new Error('useCurrentUser must be used inside a protected route')
  }
  return state.user
}
