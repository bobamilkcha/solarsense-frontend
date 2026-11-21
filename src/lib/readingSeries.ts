import type { ReadingBucket } from '../api/types'
import { estimateCellTemp } from './cellTemp'
import type { SeriesPoint } from './timeseries'

type BucketValues = (bucket: ReadingBucket) => Omit<SeriesPoint, 't'>

/**
 * One chart point per bucket, at `bucket_start`. The backend leaves empty
 * buckets out, so wherever consecutive buckets are more than `bucketS` apart
 * the device was offline: a null point there breaks the line.
 */
export function bucketsToSeries(buckets: ReadingBucket[], bucketS: number, values: BucketValues): SeriesPoint[] {
  const bucketMs = bucketS * 1000
  const points: SeriesPoint[] = []
  let previous: number | null = null
  for (const bucket of buckets) {
    const t = Date.parse(bucket.bucket_start)
    if (previous !== null && t - previous > bucketMs) points.push({ t: previous + 1, value: null })
    points.push({ t, ...values(bucket) })
    previous = t
  }
  return points
}

export const irradianceValues: BucketValues = (b) => ({ value: b.irradiance_avg_wm2, peak: b.irradiance_max_wm2 })

export const airTempValues: BucketValues = (b) => ({ value: b.ambient_temp_avg, min: b.ambient_temp_min, max: b.ambient_temp_max })

export const humidityValues: BucketValues = (b) => ({ value: b.humidity_avg, min: b.humidity_min, max: b.humidity_max })

/**
 * Estimated cell temperature per bucket. The line uses average irradiance (like
 * the other lines); the peak uses the bucket's strongest sun, as the stat tile does.
 */
export const cellTempValues: BucketValues = (b) =>
  b.ambient_temp_avg === null
    ? { value: null }
    : {
        value: estimateCellTemp(b.ambient_temp_avg, b.irradiance_avg_wm2),
        peak: estimateCellTemp(b.ambient_temp_avg, b.irradiance_max_wm2),
      }

/** Highest estimated cell temperature in the range: per bucket, average air temperature with peak irradiance. */
export function peakCellTemp(buckets: ReadingBucket[]): number | null {
  let peak: number | null = null
  for (const b of buckets) {
    if (b.ambient_temp_avg === null) continue
    const t = estimateCellTemp(b.ambient_temp_avg, b.irradiance_max_wm2)
    if (peak === null || t > peak) peak = t
  }
  return peak
}

/** "15 min", "1 h", "1 day": a bucket width for display. */
export function formatBucket(bucketS: number): string {
  if (bucketS >= 86_400 && bucketS % 86_400 === 0) return bucketS === 86_400 ? '1 day' : `${bucketS / 86_400} days`
  if (bucketS >= 3600) return `${+(bucketS / 3600).toFixed(1)} h`
  if (bucketS >= 60) return `${+(bucketS / 60).toFixed(1)} min`
  return `${bucketS} s`
}
