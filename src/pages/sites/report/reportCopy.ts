export const DISCLAIMER =
  'These figures are estimates based on uploaded TNB bills, satellite sunlight data and on-site device measurements. ' +
  'They are not a quotation. Actual system size, cost and savings depend on a full site survey, equipment and tariffs at the time of installation.'

export function shadingSourceLabel(source: string): string {
  if (source === 'device') return 'Measured on site'
  if (source === 'satellite_only') return 'Satellite only (no shading adjustment)'
  return source
}
