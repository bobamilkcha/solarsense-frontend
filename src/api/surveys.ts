/**
 * Survey spots. The backend has no endpoints for these yet (see
 * docs/BACKEND_SURVEY_SPEC.md), so this keeps them in the browser's
 * localStorage, per site. The functions are async and shaped like the
 * proposed endpoints so swapping in axios calls later only touches this file.
 */

export type SurveySpot = {
  id: string
  site_id: string
  label: string
  lat: number
  lng: number
  accuracy_m: number | null
  started_at: string
  ended_at: string
  /** Set when this spot re-measures another one, to check the sky didn't change. */
  control_for: string | null
}

export type SurveySpotInput = Omit<SurveySpot, 'id' | 'site_id'>

const storageKey = (siteId: string) => `solarsense.survey.${siteId}`

function isSpot(value: unknown): value is SurveySpot {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === 'string' &&
    typeof v.label === 'string' &&
    typeof v.lat === 'number' &&
    typeof v.lng === 'number' &&
    typeof v.started_at === 'string' &&
    typeof v.ended_at === 'string'
  )
}

function read(siteId: string): SurveySpot[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storageKey(siteId)) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter(isSpot) : []
  } catch {
    return []
  }
}

function write(siteId: string, spots: SurveySpot[]) {
  localStorage.setItem(storageKey(siteId), JSON.stringify(spots))
}

export async function listSpots(siteId: string): Promise<SurveySpot[]> {
  return read(siteId).sort((a, b) => a.started_at.localeCompare(b.started_at))
}

export async function createSpot(siteId: string, input: SurveySpotInput): Promise<SurveySpot> {
  const spot: SurveySpot = { ...input, id: crypto.randomUUID(), site_id: siteId }
  write(siteId, [...read(siteId), spot])
  return spot
}

/** Also removes the re-measurements that point at it. */
export async function deleteSpot(siteId: string, spotId: string): Promise<void> {
  write(
    siteId,
    read(siteId).filter((s) => s.id !== spotId && s.control_for !== spotId),
  )
}

export async function clearSpots(siteId: string): Promise<void> {
  localStorage.removeItem(storageKey(siteId))
}
