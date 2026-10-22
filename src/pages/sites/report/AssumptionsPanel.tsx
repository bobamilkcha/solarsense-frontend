import { useState, type FormEvent } from 'react'
import type { FeasibilityParams } from '../../../api/feasibility'
import { Button } from '../../../components/ui/Button'
import { TextField } from '../../../components/ui/TextField'
import { DEFAULT_FORM, parseAssumptions, type AssumptionsForm } from './assumptions'

type Field = { key: keyof AssumptionsForm; label: string; hint?: string; step?: string }

const FIELDS: Field[] = [
  { key: 'system_kwp', label: 'System size (kWp)', hint: 'Blank = sized to cover yearly usage', step: '0.1' },
  { key: 'cost_per_kwp_rm', label: 'Installed cost (RM per kWp)', step: '50' },
  { key: 'panel_wp', label: 'Panel size (W)', step: '5' },
  { key: 'self_consumption_pct', label: 'Self-consumption (%)', hint: 'Share of solar used on site', step: '1' },
  { key: 'performance_pct', label: 'Performance ratio (%)', hint: 'After system losses', step: '1' },
  { key: 'export_rate_rm_per_kwh', label: 'Export credit (RM/kWh)', hint: '0 = conservative', step: '0.01' },
  { key: 'afa_rate_rm_per_kwh', label: 'AFA rate (RM/kWh)', hint: 'TNB monthly fuel adjustment', step: '0.01' },
]

export function AssumptionsPanel({ onApply, busy }: { onApply: (params: FeasibilityParams) => void; busy: boolean }) {
  const [form, setForm] = useState<AssumptionsForm>(DEFAULT_FORM)
  const [submitted, setSubmitted] = useState(false)
  const { errors } = parseAssumptions(form)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    const { params } = parseAssumptions(form)
    if (params) onApply(params)
  }

  function reset() {
    setForm(DEFAULT_FORM)
    setSubmitted(false)
    const { params } = parseAssumptions(DEFAULT_FORM)
    if (params) onApply(params)
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5" noValidate>
      <h2 className="mb-1 font-semibold">Assumptions</h2>
      <p className="mb-4 text-xs text-slate-500">Adjust and recalculate. Defaults suit a typical residential install.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        {FIELDS.map((field) => (
          <TextField
            key={field.key}
            label={field.label}
            hint={field.hint}
            type="number"
            inputMode="decimal"
            step={field.step}
            value={form[field.key]}
            onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
            error={submitted ? errors[field.key] : undefined}
          />
        ))}
      </div>
      <div className="mt-5 flex gap-2">
        <Button type="submit" loading={busy} className="flex-1">
          Recalculate
        </Button>
        <Button variant="secondary" onClick={reset}>
          Reset
        </Button>
      </div>
    </form>
  )
}
