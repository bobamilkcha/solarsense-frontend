import { DISPLAY_TIME_ZONE } from '../config'

const isoDateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: DISPLAY_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** "2026-10-22" for a moment, as a Malaysian calendar date. */
export function toLocalDateString(date: Date): string {
  return isoDateFormat.format(date)
}

/** Midnight at the start of a Malaysian calendar date (UTC+8, no DST). */
export function startOfLocalDate(dateString: string): Date {
  return new Date(`${dateString}T00:00:00+08:00`)
}

export function addDays(dateString: string, days: number): string {
  const d = startOfLocalDate(dateString)
  d.setUTCDate(d.getUTCDate() + days)
  return toLocalDateString(d)
}

export function isValidDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(startOfLocalDate(value).getTime())
}
