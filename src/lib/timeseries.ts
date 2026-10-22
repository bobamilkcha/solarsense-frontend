import type { SensorReading } from '../api/types'

export type NumericField = 'irradiance_wm2' | 'ambient_temp' | 'humidity' | 'heading' | 'cell_voltage'

export type SeriesPoint = { t: number; value: number | null }

/** Sort oldest → newest by device time and drop duplicates (late data can repeat or arrive out of order). */
export function sortReadings(readings: SensorReading[]): SensorReading[] {
  const byId = new Map<string, SensorReading>()
  for (const r of readings) byId.set(r.id, r)
  return [...byId.values()].sort((a, b) => Date.parse(a.device_timestamp) - Date.parse(b.device_timestamp))
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

/**
 * Turn readings into chart points, inserting a null wherever the device went
 * quiet for much longer than usual, so the line breaks instead of drawing a
 * misleading straight segment across the gap.
 */
export function toSeriesWithGaps(sorted: SensorReading[], field: NumericField, minGapMs = 10 * 60_000): SeriesPoint[] {
  if (sorted.length === 0) return []
  const times = sorted.map((r) => Date.parse(r.device_timestamp))
  const intervals = times.slice(1).map((t, i) => t - times[i])
  const gapThreshold = Math.max(minGapMs, median(intervals) * 4)

  const points: SeriesPoint[] = []
  sorted.forEach((reading, i) => {
    if (i > 0 && times[i] - times[i - 1] > gapThreshold) {
      points.push({ t: times[i - 1] + 1, value: null })
    }
    points.push({ t: times[i], value: reading[field] })
  })
  return points
}

/**
 * Average readings into fixed time buckets for long ranges. Empty buckets
 * become null, which breaks the line, so gaps in the data stay visible.
 */
export function toBucketedSeries(
  sorted: SensorReading[],
  field: NumericField,
  startMs: number,
  endMs: number,
  bucketCount = 500,
): SeriesPoint[] {
  if (sorted.length <= bucketCount) return toSeriesWithGaps(sorted, field)
  const size = Math.max(1, (endMs - startMs) / bucketCount)
  const sums = new Array<number>(bucketCount).fill(0)
  const counts = new Array<number>(bucketCount).fill(0)
  for (const reading of sorted) {
    const index = Math.min(bucketCount - 1, Math.floor((Date.parse(reading.device_timestamp) - startMs) / size))
    if (index < 0) continue
    sums[index] += reading[field]
    counts[index] += 1
  }
  return sums.map((sum, i) => ({
    t: Math.round(startMs + (i + 0.5) * size),
    value: counts[i] ? sum / counts[i] : null,
  }))
}

export function summarize(sorted: SensorReading[], field: NumericField) {
  if (sorted.length === 0) return null
  let min = Infinity
  let max = -Infinity
  let sum = 0
  for (const r of sorted) {
    const v = r[field]
    min = Math.min(min, v)
    max = Math.max(max, v)
    sum += v
  }
  return { min, max, avg: sum / sorted.length }
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

export function compassDirection(degrees: number): string {
  const normalized = ((degrees % 360) + 360) % 360
  return COMPASS[Math.round(normalized / 45) % 8]
}
