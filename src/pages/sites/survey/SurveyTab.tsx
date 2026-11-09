import { useMemo, useState } from 'react'
import { getErrorMessage } from '../../../api/errors'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/States'
import { useNow } from '../../../hooks/useNow'
import { useScoreSettings } from '../../../hooks/useScoreSettings'
import { useLiveReadings } from '../../../hooks/useReadings'
import { useClearSpots, useDeleteSpot, useSpots } from '../../../hooks/useSurveys'
import { DRIFT_LIMIT, scoreSpots, surveyDrifted } from '../../../lib/survey'
import { useSiteContext } from '../siteContext'
import { RecordSpotPanel } from './RecordSpotPanel'
import { ScoreSettingsPanel } from './ScoreSettingsPanel'
import { SpotCard } from './SpotCard'
import { SurveyMap } from './SurveyMap'

export function SurveyTab() {
  const { site } = useSiteContext()
  const spots = useSpots(site.id)
  const readings = useLiveReadings(site.id)
  const deleteSpot = useDeleteSpot(site.id)
  const clearSpots = useClearSpots(site.id)
  const [settings, setSettings] = useScoreSettings()
  const [recheckId, setRecheckId] = useState<string | null>(null)
  const now = useNow(5_000)

  const scored = useMemo(
    () => scoreSpots(spots.data ?? [], readings.data ?? [], settings, now),
    [spots.data, readings.data, settings, now],
  )
  const active = (spots.data ?? []).find((s) => Date.parse(s.ended_at) > now) ?? null
  const recheck = (spots.data ?? []).find((s) => s.id === recheckId) ?? null
  const ranked = [...scored].sort((a, b) => (a.rank ?? 1e9) - (b.rank ?? 1e9) || a.spot.started_at.localeCompare(b.spot.started_at))
  const primaryCount = scored.length

  if (spots.isPending) return <LoadingState label="Loading survey…" />
  if (spots.isError) return <ErrorState error={spots.error} title="Couldn't load the survey" onRetry={() => spots.refetch()} />

  return (
    <div className="space-y-5">
      <Alert tone="info">
        <p className="font-medium">Find the best spot on site</p>
        <p className="mt-1">
          Walk the site with the device and this page open on your phone. Record each candidate spot and the best one is
          ranked at the top. Survey in steady midday sun if you can, and set the device&apos;s publish interval to 5–10 s
          first (Overview tab) so each spot gets enough readings.
        </p>
        <p className="mt-2 text-xs">
          Prototype: spots are saved on this device only until the backend supports them (docs/BACKEND_SURVEY_SPEC.md).
        </p>
      </Alert>

      {!site.device_id && <Alert tone="warning">No device is paired to this site, so there are no readings to score.</Alert>}
      {readings.isError && !readings.data && (
        <Alert tone="error">Couldn&apos;t load readings: {getErrorMessage(readings.error)}</Alert>
      )}

      <RecordSpotPanel
        siteId={site.id}
        spotCount={primaryCount}
        active={active}
        recheck={recheck}
        onCancelRecheck={() => setRecheckId(null)}
      />

      {surveyDrifted(scored) && (
        <Alert tone="warning">
          A re-check differed by more than {Math.round(DRIFT_LIMIT * 100)}%, so the sky probably changed during your walk
          (cloud or time of day). Treat the ranking as unreliable and consider surveying again in steadier light.
        </Alert>
      )}

      {scored.length === 0 ? (
        <EmptyState title="No spots recorded yet" description="Record your first spot above. Walk to the next one when the countdown ends." />
      ) : (
        <>
          <SurveyMap spots={scored} site={{ lat: site.location_lat, lng: site.location_lng }} />
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            {ranked.map((item) => (
              <SpotCard
                key={item.spot.id}
                item={item}
                deleting={deleteSpot.isPending && deleteSpot.variables === item.spot.id}
                onRecheck={() => {
                  setRecheckId(item.spot.id)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                onDelete={() => {
                  if (window.confirm(`Delete “${item.spot.label}”?`)) deleteSpot.mutate(item.spot.id)
                }}
              />
            ))}
          </ul>
          {deleteSpot.isError && <Alert tone="error">{getErrorMessage(deleteSpot.error)}</Alert>}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              className="text-red-700 hover:bg-red-50"
              loading={clearSpots.isPending}
              onClick={() => {
                if (window.confirm('Delete every spot in this survey?')) clearSpots.mutate()
              }}
            >
              Clear survey
            </Button>
          </div>
        </>
      )}

      <ScoreSettingsPanel settings={settings} onChange={setSettings} />
    </div>
  )
}
