export const DISCLAIMER =
  'These figures are estimates based on uploaded TNB bills, satellite sunlight data and on-site device measurements. ' +
  'They are not a quotation. Actual system size, cost and savings depend on a full site survey, equipment and tariffs at the time of installation.'

type ExportCredit = { scheme: string; rate_rm_per_kwh: number }

/** How exported solar was credited, e.g. for the savings tile and the PDF.
 * `credit` is missing from older backends, which credited nothing by default. */
export function exportCreditLabel(credit: ExportCredit | undefined): string {
  if (!credit) return 'No export credit'
  if (credit.scheme === 'solar_atap') return 'Solar ATAP export credit'
  if (credit.rate_rm_per_kwh === 0) return 'No export credit'
  return `Export credit RM ${credit.rate_rm_per_kwh.toFixed(3)}/kWh`
}

export function shadingSourceLabel(source: string): string {
  if (source === 'device') return 'Measured on site'
  if (source === 'satellite_only') return 'Satellite only (no shading adjustment)'
  return source
}
