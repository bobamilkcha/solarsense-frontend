import type { SensorReading } from '../api/types'
import type { SurveySpot } from '../api/surveys'

/** How long the device is held still at each spot. */
export const DWELL_S = 120
/** GPS fixes worse than this (metres) trigger a "retry?" prompt. */
export const MAX_GPS_ACCURACY_M = 20
/** Irradiance varying more than this within a window means the sky changed (cloud). */
export const UNSTABLE_CV = 0.15
/** A re-measured spot differing by more than this means the whole survey drifted. */
export const DRIFT_LIMIT = 0.15
/** A spot needs at least this many readings in its window to be scored. */
export const MIN_READINGS = 2

export type Criterion = 'irradiance' | 'tilt' | 'temperature' | 'humidity' | 'heading'

export type ScoreSettings = {
  weights: Record<Criterion, number>
  targetTiltDeg: number
  targetHeadingDeg: number
}

/**
 * Rule-of-thumb defaults for Malaysia (near the equator): a shallow tilt is
 * best and heading matters little, so heading has no weight until turned on.
 */
export const DEFAULT_SETTINGS: ScoreSettings = {
  weights: { irradiance: 50, tilt: 20, temperature: 15, humidity: 15, heading: 0 },
  targetTiltDeg: 10,
  targetHeadingDeg: 180,
}

export const CRITERION_LABELS: Record<Criterion, string> = {
  irradiance: 'Irradiance',
  tilt: 'Tilt',
  temperature: 'Temperature',
  humidity: 'Humidity',
  heading: 'Heading',
}

export type SpotStats = {
  count: number
  irradiance: number | null
  /** Std deviation / mean of irradiance in the window; null with under 3 readings. */
  irradianceCv: number | null
  temp: number | null
  humidity: number | null
  tilt: number | null
  heading: number | null
}

export type SpotStatus = 'recording' | 'waiting' | 'unstable' | 'ready'

export type ScoredSpot = {
  spot: SurveySpot
  stats: SpotStats
  status: SpotStatus
  /** 0-100, or null while not ready. */
  score: number | null
  /** 0-1 per criterion that had data. */
  parts: Partial<Record<Criterion, number>>
  /** 1 = best. Null while not ready. */
  rank: number | null
  /** Relative change of a re-measurement vs this spot (0.1 = 10% higher), if one exists. */
  drift: number | null
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/** Compass headings wrap at 360, so average them as vectors. */
function circularMean(degrees: number[]): number | null {
  if (degrees.length === 0) return null
  let x = 0
  let y = 0
  for (const d of degrees) {
    x += Math.cos((d * Math.PI) / 180)
    y += Math.sin((d * Math.PI) / 180)
  }
  return (((Math.atan2(y, x) * 180) / Math.PI) % 360 + 360) % 360
}

function angleDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

const present = (values: (number | null)[]): number[] => values.filter((v): v is number => v !== null)

/** Median of the readings taken inside the spot's time window. Null sensor values are skipped, never counted as 0. */
export function computeStats(readings: SensorReading[], spot: Pick<SurveySpot, 'started_at' | 'ended_at'>): SpotStats {
  const from = Date.parse(spot.started_at)
  const to = Date.parse(spot.ended_at)
  const inWindow = readings.filter((r) => {
    const t = Date.parse(r.device_timestamp)
    return t >= from && t <= to
  })
  const irradiance = inWindow.map((r) => r.irradiance_wm2)
  const mean = irradiance.length ? irradiance.reduce((a, b) => a + b, 0) / irradiance.length : 0
  const cv =
    irradiance.length >= 3 && mean > 0
      ? Math.sqrt(irradiance.reduce((s, v) => s + (v - mean) ** 2, 0) / irradiance.length) / mean
      : null
  return {
    count: inWindow.length,
    irradiance: median(irradiance),
    irradianceCv: cv,
    temp: median(present(inWindow.map((r) => r.ambient_temp))),
    humidity: median(present(inWindow.map((r) => r.humidity))),
    tilt: median(present(inWindow.map((r) => r.tilt_deg))),
    heading: circularMean(present(inWindow.map((r) => r.heading))),
  }
}

function statusOf(spot: SurveySpot, stats: SpotStats, now: number): SpotStatus {
  if (now < Date.parse(spot.ended_at)) return 'recording'
  if (stats.count < MIN_READINGS || stats.irradiance === null) return 'waiting'
  if (stats.irradianceCv !== null && stats.irradianceCv > UNSTABLE_CV) return 'unstable'
  return 'ready'
}

/** Score for one criterion from 0 (bad) to 1 (best), or null if the spot has no value for it. */
function criterionScore(
  criterion: Exclude<Criterion, 'irradiance'>,
  stats: SpotStats,
  settings: ScoreSettings,
): number | null {
  switch (criterion) {
    case 'tilt':
      return stats.tilt === null ? null : clamp01(1 - angleDiff(stats.tilt, settings.targetTiltDeg) / 30)
    case 'temperature':
      // Cooler is better: full marks at 28 °C or below, none at 40 °C or above.
      return stats.temp === null ? null : clamp01((40 - stats.temp) / 12)
    case 'humidity':
      // Matches the Live tab guide: under 60% is low concern, over 80% high.
      return stats.humidity === null ? null : clamp01((90 - stats.humidity) / 30)
    case 'heading':
      return stats.heading === null ? null : clamp01(1 - angleDiff(stats.heading, settings.targetHeadingDeg) / 90)
  }
}

/**
 * Score and rank the surveyed spots. Irradiance is judged relative to the best
 * spot in this survey (it is an uncalibrated proxy, so absolute values mean
 * little); the rest are judged against fixed targets. Spots still recording,
 * without enough readings, or recorded under unstable sky are not ranked.
 */
export function scoreSpots(
  spots: SurveySpot[],
  readings: SensorReading[],
  settings: ScoreSettings,
  now: number,
): ScoredSpot[] {
  const measured = spots.map((spot) => {
    const stats = computeStats(readings, spot)
    return { spot, stats, status: statusOf(spot, stats, now) }
  })

  const primary = measured.filter((m) => m.spot.control_for === null)
  const best = Math.max(0, ...primary.filter((m) => m.status === 'ready').map((m) => m.stats.irradiance ?? 0))

  const scored: ScoredSpot[] = primary.map(({ spot, stats, status }) => {
    const parts: Partial<Record<Criterion, number>> = {}
    let score: number | null = null
    if (status === 'ready' && stats.irradiance !== null && best > 0) {
      parts.irradiance = clamp01(stats.irradiance / best)
      for (const c of ['tilt', 'temperature', 'humidity', 'heading'] as const) {
        const part = criterionScore(c, stats, settings)
        if (part !== null) parts[c] = part
      }
      let weighted = 0
      let total = 0
      for (const [c, part] of Object.entries(parts) as [Criterion, number][]) {
        weighted += settings.weights[c] * part
        total += settings.weights[c]
      }
      score = total > 0 ? Math.round((weighted / total) * 100) : null
    }

    const control = measured.find((m) => m.spot.control_for === spot.id && m.status === 'ready')
    const drift =
      control && status === 'ready' && stats.irradiance && control.stats.irradiance !== null
        ? (control.stats.irradiance - stats.irradiance) / stats.irradiance
        : null
    return { spot, stats, status, score, parts, rank: null, drift }
  })

  const ranked = scored.filter((s) => s.score !== null).sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  ranked.forEach((s, i) => (s.rank = i + 1))
  return scored
}

/** True when any re-measured spot moved more than DRIFT_LIMIT, so the sky changed during the walk. */
export function surveyDrifted(scored: ScoredSpot[]): boolean {
  return scored.some((s) => s.drift !== null && Math.abs(s.drift) > DRIFT_LIMIT)
}

/** Red (poor) through amber to green (best), for map pins and score chips. */
export function scoreColor(score: number | null): string {
  if (score === null) return '#94a3b8'
  if (score >= 75) return '#059669'
  if (score >= 50) return '#d97706'
  return '#dc2626'
}
