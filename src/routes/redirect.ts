/** Where to send the user after login: the page they were trying to open, or the projects list. */
export function redirectTarget(state: unknown): string {
  if (typeof state === 'object' && state !== null && 'from' in state && typeof state.from === 'string') {
    const from = state.from
    if (from.startsWith('/') && !from.startsWith('//') && from !== '/login') return from
  }
  return '/projects'
}
