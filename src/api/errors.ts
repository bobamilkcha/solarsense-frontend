import { isAxiosError } from 'axios'

type ValidationIssue = { loc?: (string | number)[]; msg?: string }

function fromDetail(detail: unknown): string | null {
  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail)) {
    const messages = (detail as ValidationIssue[])
      .map((issue) => {
        const field = issue.loc?.filter((part) => part !== 'body' && part !== 'query').join('.')
        return issue.msg ? (field ? `${field}: ${issue.msg}` : issue.msg) : null
      })
      .filter((message): message is string => Boolean(message))
    if (messages.length) return messages.join('. ')
  }
  return null
}

const STATUS_FALLBACKS: Record<number, string> = {
  400: 'The request was not accepted.',
  401: 'Your session has expired. Please log in again.',
  403: "You don't have permission to do that.",
  404: "We couldn't find that. It may have been removed.",
  409: 'That conflicts with existing data.',
  422: 'Some of the information provided is invalid.',
  502: 'Satellite data is unavailable right now. Please try again shortly.',
}

/** Turn any thrown value into a message that is safe to show the user. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (isAxiosError(error)) {
    if (!error.response) {
      return "Can't reach the SolarSense server. Check your connection and try again."
    }
    const data: unknown = error.response.data
    const detail = typeof data === 'object' && data !== null && 'detail' in data ? data.detail : undefined
    return fromDetail(detail) ?? STATUS_FALLBACKS[error.response.status] ?? fallback
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export function getErrorStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined
}
