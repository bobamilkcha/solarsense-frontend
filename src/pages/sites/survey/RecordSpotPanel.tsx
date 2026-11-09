import { useState } from 'react'
import { getErrorMessage } from '../../../api/errors'
import type { SurveySpot } from '../../../api/surveys'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { TextField } from '../../../components/ui/TextField'
import { useCreateSpot } from '../../../hooks/useSurveys'
import { useNow } from '../../../hooks/useNow'
import { getPosition, type Position } from '../../../lib/geo'
import { DWELL_S, MAX_GPS_ACCURACY_M } from '../../../lib/survey'

type Props = {
  siteId: string
  spotCount: number
  /** The spot currently being measured, if any. */
  active: SurveySpot | null
  /** When set, the next recording re-measures this spot. */
  recheck: SurveySpot | null
  onCancelRecheck: () => void
}

function Countdown({ spot }: { spot: SurveySpot }) {
  const now = useNow(1000)
  const total = Date.parse(spot.ended_at) - Date.parse(spot.started_at)
  const left = Math.max(0, Date.parse(spot.ended_at) - now)
  const pct = Math.min(100, Math.round(((total - left) / total) * 100))
  return (
    <div role="status" aria-live="polite">
      <p className="font-medium text-slate-900">Measuring “{spot.label}”… hold the device still</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{Math.ceil(left / 1000)} s</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full bg-amber-500 transition-[width] duration-1000 ease-linear" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function RecordSpotPanel({ siteId, spotCount, active, recheck, onCancelRecheck }: Props) {
  const create = useCreateSpot(siteId)
  const [label, setLabel] = useState('')
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lowAccuracy, setLowAccuracy] = useState<Position | null>(null)

  const defaultLabel = recheck ? `${recheck.label} (re-check)` : `Spot ${spotCount + 1}`

  function save(position: Position) {
    const start = Date.now()
    create.mutate(
      {
        label: label.trim() || defaultLabel,
        lat: position.lat,
        lng: position.lng,
        accuracy_m: position.accuracyM,
        started_at: new Date(start).toISOString(),
        ended_at: new Date(start + DWELL_S * 1000).toISOString(),
        control_for: recheck?.id ?? null,
      },
      {
        onSuccess: () => {
          setLabel('')
          setLowAccuracy(null)
          onCancelRecheck()
        },
      },
    )
  }

  async function start() {
    setError(null)
    setLowAccuracy(null)
    setLocating(true)
    try {
      const position = await getPosition()
      if (position.accuracyM !== null && position.accuracyM > MAX_GPS_ACCURACY_M) setLowAccuracy(position)
      else save(position)
    } catch (e) {
      setError(getErrorMessage(e, "Couldn't get your location."))
    } finally {
      setLocating(false)
    }
  }

  if (active) {
    return (
      <Card>
        <Countdown spot={active} />
      </Card>
    )
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-semibold">{recheck ? `Re-check “${recheck.label}”` : 'Record a spot'}</h2>
        <p className="mt-1 text-sm text-slate-600">
          {recheck
            ? 'Stand at the same place, aimed the same way. This shows whether the sky changed during your walk.'
            : `Stand at the spot with the device aimed the way the panels would sit, then tap Record. Hold still for ${DWELL_S} seconds.`}
        </p>
      </div>
      <TextField
        label="Name (optional)"
        value={label}
        maxLength={100}
        placeholder={defaultLabel}
        onChange={(e) => setLabel(e.target.value)}
      />
      {lowAccuracy && (
        <Alert tone="warning">
          <p>
            GPS is only accurate to about {Math.round(lowAccuracy.accuracyM ?? 0)} m here (aim for under {MAX_GPS_ACCURACY_M} m). Move
            to open sky, or use it anyway.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => void start()}>
              Try again
            </Button>
            <Button size="sm" onClick={() => save(lowAccuracy)}>
              Use anyway
            </Button>
          </div>
        </Alert>
      )}
      {error && <Alert tone="error">{error}</Alert>}
      {create.isError && <Alert tone="error">{getErrorMessage(create.error)}</Alert>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button className="sm:min-w-44" loading={locating || create.isPending} onClick={() => void start()}>
          {locating ? 'Getting location…' : recheck ? 'Record re-check' : 'Record spot'}
        </Button>
        {recheck && (
          <Button variant="secondary" onClick={onCancelRecheck}>
            Cancel
          </Button>
        )}
      </div>
    </Card>
  )
}
