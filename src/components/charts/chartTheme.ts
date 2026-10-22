/**
 * Chart colors from the validated reference palette (dataviz skill).
 * Categorical slots are used in fixed order; never cycle or reorder them.
 */
export const SERIES = {
  1: '#2a78d6', // blue
  2: '#eb6834', // orange
} as const

export const CHART = {
  grid: '#e2e8f0', // slate-200, hairline
  axis: '#64748b', // slate-500 text
  surface: '#ffffff',
  crosshair: '#94a3b8',
} as const
