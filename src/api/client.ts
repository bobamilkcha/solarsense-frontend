import axios, { isAxiosError, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { API_URL } from '../config'
import { session } from '../auth/session'
import type { AuthResponse } from './types'

export const api = axios.create({
  baseURL: API_URL,
  // Needed so the browser sends and stores the httpOnly refresh cookie.
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = session.getAccessToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

let refreshInFlight: Promise<AuthResponse> | null = null

async function doRefresh(): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/refresh')
  return data
}

/**
 * Get a new access token from the refresh cookie.
 *
 * Refresh tokens rotate, and reusing an old one makes the backend revoke
 * every session for the user. So all callers share one in-flight request,
 * and a Web Lock serialises refreshes across browser tabs.
 */
export function refreshSession(): Promise<AuthResponse> {
  if (!refreshInFlight) {
    const run = () => doRefresh()
    const locked =
      typeof navigator !== 'undefined' && navigator.locks
        ? navigator.locks.request('solarsense-auth-refresh', run)
        : run()
    refreshInFlight = locked
      .then((data) => {
        session.signIn(data.access_token, data.user)
        return data
      })
      .finally(() => {
        refreshInFlight = null
      })
  }
  return refreshInFlight
}

// Auth endpoints whose 401 means "bad credentials / logged out", not "token expired".
const NO_RETRY_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
  '/auth/invitations/',
]

type RetryableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined
    const url = config?.url ?? ''
    const shouldRetry =
      error.response?.status === 401 &&
      config !== undefined &&
      !config._retried &&
      !NO_RETRY_PATHS.some((path) => url.startsWith(path))

    if (!shouldRetry) return Promise.reject(error)

    config._retried = true
    try {
      await refreshSession()
    } catch (refreshError) {
      // Only a rejected refresh means "logged out" (ProtectedRoute then sends them to /login).
      // A network blip (patchy signal onsite) keeps the session so the next request can retry.
      const status = isAxiosError(refreshError) ? refreshError.response?.status : undefined
      if (status === 401 || status === 403) session.signOut()
      return Promise.reject(error)
    }
    return api(config)
  },
)
