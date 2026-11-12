/**
 * Reference values drawn on the live charts. These are frontend guide values,
 * not API data: tune them here. They are rules of thumb for a quick read of a
 * site, not a yield prediction.
 */
export type ColorStop = { value: number; color: string }

export type ChartBenchmark = {
  /** Yellow line: the ideal reading. */
  reference: { value: number; label: string }
  /** Optional red line: readings below this make the site doubtful. */
  minimum?: { value: number; label: string }
  /** Line color by value, as stops sorted by ascending value. Values outside the range take the end colors. */
  stops: ColorStop[]
}

const GREEN = '#16a34a'
const ORANGE = '#f97316'
const RED = '#dc2626'
const NEUTRAL = '#94a3b8' // night: not a site problem, so no verdict

export const REFERENCE_LINE_COLOR = '#eab308'
export const MINIMUM_LINE_COLOR = RED

/** Full sun (STC). Below the minimum the site is doubtful; night readings stay neutral. */
export const IRRADIANCE_BENCHMARK: ChartBenchmark = {
  reference: { value: 1000, label: 'Full sun 1000 W/m²' },
  minimum: { value: 200, label: 'Minimum 200 W/m²' },
  stops: [
    { value: 0, color: NEUTRAL },
    { value: 40, color: NEUTRAL },
    { value: 60, color: RED },
    { value: 200, color: RED },
    { value: 500, color: ORANGE },
    { value: 800, color: GREEN },
  ],
}

/**
 * For ESTIMATED CELL temperature only, never air temperature: the 25 °C rating is
 * the cell temperature at standard test conditions (STC), and cells in sun run
 * 20–30 °C above the air. Output drops roughly 0.3–0.4% per °C above 25 °C, so
 * orange (45 °C) is about 7% loss and red (60 °C) about 12%.
 */
export const CELL_TEMPERATURE_BENCHMARK: ChartBenchmark = {
  reference: { value: 25, label: 'STC cell 25 °C' },
  stops: [
    { value: 25, color: GREEN },
    { value: 45, color: ORANGE },
    { value: 60, color: RED },
  ],
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function mixColors(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  const c = (x: number, y: number) => Math.round(x + (y - x) * t)
  return `rgb(${c(ar, br)}, ${c(ag, bg)}, ${c(ab, bb)})`
}

export function colorAt(stops: ColorStop[], value: number): string {
  if (value <= stops[0].value) return stops[0].color
  const last = stops[stops.length - 1]
  if (value >= last.value) return last.color
  const i = stops.findIndex((s) => s.value >= value)
  const lo = stops[i - 1]
  const hi = stops[i]
  return hi.value === lo.value ? hi.color : mixColors(lo.color, hi.color, (value - lo.value) / (hi.value - lo.value))
}

/**
 * SVG gradient stops (top to bottom) that color a line by its value. Offsets are
 * fractions of the line's own vertical extent, so pass the min and max of the drawn values.
 */
export function gradientStops(stops: ColorStop[], min: number, max: number): { offset: number; color: string }[] {
  const range = max - min
  const toOffset = (v: number) => (max - v) / range
  const inside = stops.filter((s) => s.value > min && s.value < max).sort((a, b) => b.value - a.value)
  return [
    { offset: 0, color: colorAt(stops, max) },
    ...inside.map((s) => ({ offset: toOffset(s.value), color: s.color })),
    { offset: 1, color: colorAt(stops, min) },
  ]
}
