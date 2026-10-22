import type { TNBBill } from '../../../api/types'
import { DISPLAY_TIME_ZONE } from '../../../config'

const PARSED_FIELDS = [
  'billing_period_start',
  'billing_period_end',
  'kwh_used',
  'tariff_category',
  'amount_due',
  'current_charges',
] as const satisfies readonly (keyof TNBBill)[]

export const PARSED_FIELD_COUNT = PARSED_FIELDS.length

export function countParsedFields(bill: TNBBill): number {
  return PARSED_FIELDS.filter((field) => bill[field] !== null).length
}

/** Short label for the bill's month, e.g. "Sep 2026", from its period end (or start). */
export function billMonthLabel(bill: TNBBill): string | null {
  const date = bill.billing_period_end ?? bill.billing_period_start
  if (!date) return null
  return new Date(`${date}T00:00:00+08:00`).toLocaleDateString('en-MY', {
    month: 'short',
    year: 'numeric',
    timeZone: DISPLAY_TIME_ZONE,
  })
}
