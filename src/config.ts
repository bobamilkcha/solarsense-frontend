function resolveApiUrl(): string {
  const url = import.meta.env.VITE_API_URL
  if (url) return url.replace(/\/+$/, '')
  if (import.meta.env.DEV) return 'http://localhost:8000'
  throw new Error('VITE_API_URL is not set. Add it to your environment before building.')
}

export const API_URL = resolveApiUrl()

/**
 * How often the Live Data view polls for new readings.
 * docs/FRONTEND.md recommends 30-60 s to match the firmware send interval.
 */
export const LIVE_POLL_INTERVAL_MS = 30_000

/** All timestamps are shown in Malaysian time. */
export const DISPLAY_TIME_ZONE = 'Asia/Kuala_Lumpur'
