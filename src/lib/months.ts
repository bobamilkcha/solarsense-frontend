import { DISPLAY_TIME_ZONE } from '../config'

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const MONTH_LONG_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** 1-12, in Malaysian time. */
export function currentMonth(): number {
  return Number(new Intl.DateTimeFormat('en-MY', { timeZone: DISPLAY_TIME_ZONE, month: 'numeric' }).format(new Date()))
}
