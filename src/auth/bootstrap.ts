import { refreshSession } from '../api/client'
import { session } from './session'

let started = false

/**
 * On page load, swap the refresh cookie for an access token.
 * Runs once per page load (outside React, so StrictMode can't double it).
 */
export function bootstrapSession() {
  if (started) return
  started = true
  refreshSession().catch(() => session.signOut())
}
