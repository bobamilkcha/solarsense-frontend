import type { User } from '../api/types'

/**
 * In-memory session store. The access token never touches localStorage;
 * a page reload recovers it from the httpOnly refresh cookie.
 */
export type SessionState =
  | { status: 'loading'; user: null; accessToken: null }
  | { status: 'anonymous'; user: null; accessToken: null }
  | { status: 'authenticated'; user: User; accessToken: string }

let state: SessionState = { status: 'loading', user: null, accessToken: null }
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

export const session = {
  get: (): SessionState => state,
  getAccessToken: (): string | null => state.accessToken,
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  signIn(accessToken: string, user: User) {
    state = { status: 'authenticated', user, accessToken }
    emit()
  },
  signOut() {
    state = { status: 'anonymous', user: null, accessToken: null }
    emit()
  },
}
