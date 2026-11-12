import type { SensorReading } from '../api/types'

/**
 * Nominal Operating Cell Temperature: the cell temperature a panel reaches at
 * 800 W/m², 20 °C air and 1 m/s wind. 45 °C is typical for crystalline silicon
 * modules; check the panel datasheet for the exact value.
 */
export const DEFAULT_NOCT_C = 45

/**
 * Estimate panel cell temperature from air temperature and irradiance with the
 * NOCT model: T_cell ≈ T_air + (NOCT − 20) / 800 × G. It ignores wind and
 * mounting, so it is a rough guide, and it inherits any error in the
 * irradiance reading (calibration is still pending).
 */
export function estimateCellTemp(airC: number, irradianceWm2: number, noctC = DEFAULT_NOCT_C): number {
  return airC + ((noctC - 20) / 800) * Math.max(0, irradianceWm2)
}

/** Per-reading estimate, or null when the air temperature sensor gave no value. */
export function readingCellTemp(reading: SensorReading): number | null {
  return reading.ambient_temp === null ? null : estimateCellTemp(reading.ambient_temp, reading.irradiance_wm2)
}
