import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { getErrorMessage, getErrorStatus } from '../../api/errors'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { TextField } from '../../components/ui/TextField'
import { useCreateSite } from '../../hooks/useProjects'

function parseCoordinate(value: string, limit: number): number | null {
  if (!value.trim()) return null
  const n = Number(value)
  return Number.isFinite(n) && Math.abs(n) <= limit ? n : null
}

function PairDeviceForm({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const navigate = useNavigate()
  const mutation = useCreateSite(projectId)
  const [form, setForm] = useState({ name: '', device_id: '', lat: '', lng: '' })
  const [touched, setTouched] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState<string | null>(null)

  const lat = parseCoordinate(form.lat, 90)
  const lng = parseCoordinate(form.lng, 180)
  const valid = form.name.trim() && form.device_id.trim() && lat !== null && lng !== null

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
    if (!valid || lat === null || lng === null) return
    mutation.mutate(
      { name: form.name.trim(), device_id: form.device_id.trim(), location_lat: lat, location_lng: lng },
      {
        onSuccess: (site) => {
          onDone()
          navigate(`/sites/${site.id}`)
        },
      },
    )
  }

  const errorMessage =
    getErrorStatus(mutation.error) === 409
      ? 'This device ID is already paired with another site.'
      : getErrorMessage(mutation.error)

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {mutation.isError && <Alert tone="error">{errorMessage}</Alert>}
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
      <TextField
        label="Device ID"
        required
        maxLength={200}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        className="font-mono"
        value={form.device_id}
        onChange={(e) => setForm((f) => ({ ...f, device_id: e.target.value }))}
        hint="The ID the ESP32 device reports. It must match exactly."
        error={touched && !form.device_id.trim() ? 'Device ID is required.' : undefined}
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
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={mutation.isPending}>
          Pair device
        </Button>
      </div>
    </form>
  )
}

export function PairDeviceDialog({ projectId, open, onClose }: { projectId: string; open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Pair a device to a new site">
      <PairDeviceForm projectId={projectId} onDone={onClose} />
    </Modal>
  )
}
