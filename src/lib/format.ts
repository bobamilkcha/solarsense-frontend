import { DISPLAY_TIME_ZONE } from '../config'

const dateTimeFormat = new Intl.DateTimeFormat('en-MY', {
  timeZone: DISPLAY_TIME_ZONE,
  dateStyle: 'medium',
  timeStyle: 'short',
})
const dateFormat = new Intl.DateTimeFormat('en-MY', { timeZone: DISPLAY_TIME_ZONE, dateStyle: 'medium' })
const timeFormat = new Intl.DateTimeFormat('en-MY', {
  timeZone: DISPLAY_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

function toDate(value: string | number | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** "22 Oct 2026, 3:45 pm" in Malaysian time. */
export function formatDateTime(value: string | number | Date | null | undefined): string {
  if (value == null) return '—'
  const date = toDate(value)
  return date ? dateTimeFormat.format(date) : '—'
}

export function formatDate(value: string | number | Date | null | undefined): string {
  if (value == null) return '—'
  const date = toDate(value)
  return date ? dateFormat.format(date) : '—'
}

/** "15:45" in Malaysian time, for chart axes. */
export function formatTime(value: string | number | Date): string {
  const date = toDate(value)
  return date ? timeFormat.format(date) : ''
}

export function formatNumber(value: number | null | undefined, maximumFractionDigits = 1): string {
  if (value == null || Number.isNaN(value)) return '—'
  return value.toLocaleString('en-MY', { maximumFractionDigits })
}

export function formatRM(value: number | null | undefined, maximumFractionDigits = 2): string {
  if (value == null || Number.isNaN(value)) return '—'
  return `RM ${value.toLocaleString('en-MY', { minimumFractionDigits: maximumFractionDigits, maximumFractionDigits })}`
}

/** "5 min ago", used for "last reading" freshness. */
export function formatRelative(value: string, now = Date.now()): string {
  const date = toDate(value)
  if (!date) return '—'
  const seconds = Math.round((now - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return `${hours} h ago`
  return `${Math.round(hours / 24)} days ago`
}
