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
 * Average readings into buckets of `intervalMs`, aligned to the clock (so
 * 1-minute buckets start on the minute). Buckets with no readings are skipped,
 * and the line breaks where the device was quiet for much longer than the interval.
 */
export function toIntervalSeries(
  sorted: SensorReading[],
  field: NumericField,
  intervalMs: number,
  minGapMs = 10 * 60_000,
): SeriesPoint[] {
  const buckets = new Map<number, { sum: number; count: number }>()
  for (const reading of sorted) {
    const value = reading[field]
    if (value === null) continue // sensor failed on the device: no data, not zero
    const key = Math.floor(Date.parse(reading.device_timestamp) / intervalMs) * intervalMs
    const bucket = buckets.get(key) ?? { sum: 0, count: 0 }
    bucket.sum += value
    bucket.count += 1
    buckets.set(key, bucket)
  }
  const gapThreshold = Math.max(minGapMs, intervalMs * 4)
  const points: SeriesPoint[] = []
  let previous: number | null = null
  for (const [t, { sum, count }] of [...buckets].sort((a, b) => a[0] - b[0])) {
    if (previous !== null && t - previous > gapThreshold) points.push({ t: previous + 1, value: null })
    points.push({ t, value: sum / count })
    previous = t
  }
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
    const value = reading[field]
    if (value === null) continue
    const index = Math.min(bucketCount - 1, Math.floor((Date.parse(reading.device_timestamp) - startMs) / size))
    if (index < 0) continue
    sums[index] += value
    counts[index] += 1
  }
  return sums.map((sum, i) => ({
    t: Math.round(startMs + (i + 0.5) * size),
    value: counts[i] ? sum / counts[i] : null,
  }))
}

export function summarize(sorted: SensorReading[], field: NumericField) {
  let min = Infinity
  let max = -Infinity
  let sum = 0
  let count = 0
  for (const r of sorted) {
    const v = r[field]
    if (v === null) continue
    min = Math.min(min, v)
    max = Math.max(max, v)
    sum += v
    count += 1
  }
  return count === 0 ? null : { min, max, avg: sum / count }
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

export function compassDirection(degrees: number): string {
  const normalized = ((degrees % 360) + 360) % 360
  return COMPASS[Math.round(normalized / 45) % 8]
}
