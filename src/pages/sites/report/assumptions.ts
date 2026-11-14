import type { FeasibilityParams } from '../../../api/feasibility'

/** Form values as typed strings; percentages are shown as 0-100. */
export type AssumptionsForm = {
  system_kwp: string
  cost_per_kwp_rm: string
  self_consumption_pct: string
  performance_pct: string
  export_rate_rm_per_kwh: string
  panel_wp: string
  afa_rate_rm_per_kwh: string
}

/** Backend defaults from docs/FRONTEND.md. system_kwp blank = auto-size;
 * export_rate_rm_per_kwh blank = Solar ATAP. */
export const DEFAULT_FORM: AssumptionsForm = {
  system_kwp: '',
  cost_per_kwp_rm: '4000',
  self_consumption_pct: '60',
  performance_pct: '80',
  export_rate_rm_per_kwh: '',
  panel_wp: '550',
  afa_rate_rm_per_kwh: '0',
}

export type FormErrors = Partial<Record<keyof AssumptionsForm, string>>

function num(value: string): number {
  return value.trim() === '' ? NaN : Number(value)
}

/** Validate against the ranges in docs/openapi.json and convert to API params. */
export function parseAssumptions(form: AssumptionsForm): { params: FeasibilityParams | null; errors: FormErrors } {
  const errors: FormErrors = {}
  const kwp = num(form.system_kwp)
  const cost = num(form.cost_per_kwp_rm)
  const selfPct = num(form.self_consumption_pct)
  const perfPct = num(form.performance_pct)
  const exportRate = num(form.export_rate_rm_per_kwh)
  const panel = num(form.panel_wp)
  const afa = num(form.afa_rate_rm_per_kwh)

  if (form.system_kwp.trim() !== '' && !(kwp > 0 && kwp <= 1000)) errors.system_kwp = 'Between 0 and 1000 kWp, or blank to auto-size.'
  if (!(cost > 0)) errors.cost_per_kwp_rm = 'Must be more than 0.'
  if (!(selfPct >= 0 && selfPct <= 100)) errors.self_consumption_pct = 'Between 0 and 100%.'
  if (!(perfPct > 0 && perfPct <= 100)) errors.performance_pct = 'Between 1 and 100%.'
  if (form.export_rate_rm_per_kwh.trim() !== '' && !(exportRate >= 0))
    errors.export_rate_rm_per_kwh = 'Zero or more, or blank for Solar ATAP.'
  if (!(panel > 0)) errors.panel_wp = 'Must be more than 0.'
  if (!Number.isFinite(afa)) errors.afa_rate_rm_per_kwh = 'Enter a number (can be negative).'

  if (Object.keys(errors).length) return { params: null, errors }
  const params: FeasibilityParams = {
    cost_per_kwp_rm: cost,
    self_consumption_ratio: selfPct / 100,
    performance_ratio: perfPct / 100,
    panel_wp: panel,
    afa_rate_rm_per_kwh: afa,
  }
  if (form.system_kwp.trim() !== '') params.system_kwp = kwp
  if (form.export_rate_rm_per_kwh.trim() !== '') params.export_rate_rm_per_kwh = exportRate
  return { params, errors }
}
