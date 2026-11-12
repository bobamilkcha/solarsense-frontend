import { useState, type FormEvent, type ReactNode } from 'react'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'

export type SiteFormValues = { name: string; lat: number; lng: number }

function parseCoordinate(value: string, limit: number): number | null {
  if (!value.trim()) return null
  const n = Number(value)
  return Number.isFinite(n) && Math.abs(n) <= limit ? n : null
}

type SiteFormProps = {
  initial?: SiteFormValues
  submitLabel: string
  pending: boolean
  error: string | null
  onSubmit: (values: SiteFormValues) => void
  onCancel: () => void
  /** Extra content under the location fields, given the values typed so far. */
  note?: (values: { lat: number | null; lng: number | null }) => ReactNode
}

/** Name + location fields, shared by "Add a site" and "Edit site". */
export function SiteForm({ initial, submitLabel, pending, error, onSubmit, onCancel, note }: SiteFormProps) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    lat: initial ? String(initial.lat) : '',
    lng: initial ? String(initial.lng) : '',
  })
  const [touched, setTouched] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState<string | null>(null)

  const lat = parseCoordinate(form.lat, 90)
  const lng = parseCoordinate(form.lng, 180)

  function fillCurrentLocation() {
    if (!navigator.geolocation) {
      setLocateError('Location is not available in this browser.')
      return
    }
    setLocating(true)
    setLocateError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }))
        setLocating(false)
      },
      () => {
        setLocateError("Couldn't get your location. Check location permission, or type the coordinates.")
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 15_000 },
    )
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setTouched(true)
    const name = form.name.trim()
    if (!name || lat === null || lng === null) return
    onSubmit({ name, lat, lng })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && <Alert tone="error">{error}</Alert>}
      <TextField
        label="Site name"
        required
        maxLength={200}
        autoFocus
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        placeholder="e.g. Main roof"
        error={touched && !form.name.trim() ? 'Site name is required.' : undefined}
      />
      <div>
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Latitude"
            inputMode="decimal"
            required
            value={form.lat}
            onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
            placeholder="3.139"
            error={touched && lat === null ? 'Between -90 and 90.' : undefined}
          />
          <TextField
            label="Longitude"
            inputMode="decimal"
            required
            value={form.lng}
            onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
            placeholder="101.687"
            error={touched && lng === null ? 'Between -180 and 180.' : undefined}
          />
        </div>
        <Button variant="secondary" size="sm" className="mt-2" onClick={fillCurrentLocation} loading={locating}>
          Use my current location
        </Button>
        {locateError && <p className="mt-1 text-xs text-red-600">{locateError}</p>}
      </div>
      {note?.({ lat, lng })}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
