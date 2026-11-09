import { MAX_PUBLISH_INTERVAL_S, MIN_PUBLISH_INTERVAL_S } from '../api/deviceConfig'

/** Returns an error message, or null when the text is a valid whole number of seconds in range. */
export function validateInterval(text: string): string | null {
  const trimmed = text.trim()
  if (trimmed === '') return 'Enter a number of seconds.'
  if (!/^\d+$/.test(trimmed)) return 'Use a whole number of seconds.'
  const value = Number(trimmed)
  if (value < MIN_PUBLISH_INTERVAL_S || value > MAX_PUBLISH_INTERVAL_S) {
    return `Must be between ${MIN_PUBLISH_INTERVAL_S} and ${MAX_PUBLISH_INTERVAL_S} seconds.`
  }
  return null
}
