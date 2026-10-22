export type ShadingLevel = 'good' | 'some' | 'heavy'

/**
 * Rough reading of the device-to-satellite ratio. ~1.0 means the site gets
 * the expected sunlight; well below suggests shading. Thresholds are a guide.
 */
export function shadingLevel(ratio: number): ShadingLevel {
  if (ratio >= 0.9) return 'good'
  if (ratio >= 0.7) return 'some'
  return 'heavy'
}

export const SHADING_COPY: Record<ShadingLevel, { label: string; detail: string }> = {
  good: { label: 'Expected sunlight', detail: 'The site gets about as much sun as satellite data predicts.' },
  some: { label: 'Some shading likely', detail: 'The site gets noticeably less sun than predicted. Check for nearby obstructions.' },
  heavy: { label: 'Significant shading', detail: 'The site gets much less sun than predicted. Investigate shading before quoting.' },
}
