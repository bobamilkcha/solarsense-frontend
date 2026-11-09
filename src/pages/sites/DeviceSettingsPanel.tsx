import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { MAX_PUBLISH_INTERVAL_S, MIN_PUBLISH_INTERVAL_S } from '../../api/deviceConfig'
import { validateInterval } from '../../lib/interval'
import { getErrorMessage, getErrorStatus } from '../../api/errors'
import type { DeviceConfig } from '../../api/types'
import { isAdmin } from '../../auth/roles'
import { useCurrentUser } from '../../auth/useSession'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import { TextField } from '../../components/ui/TextField'
import { useDeviceConfig, useSetPublishInterval } from '../../hooks/useDeviceConfig'
import { useNow } from '../../hooks/useNow'
import { formatDateTime, formatRelative } from '../../lib/format'

/** How long the "Applied" confirmation stays visible. */
const APPLIED_VISIBLE_MS = 8_000

function saveErrorMessage(error: unknown): string {
  switch (getErrorStatus(error)) {
    case 503:
      return "Couldn't reach the device network, try again. Nothing was saved."
    case 404:
      return 'Device not found or not paired.'
    default:
      return getErrorMessage(error, "Couldn't save the setting.")
  }
}

function StatusItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{children}</dd>
    </div>
  )
}

function StatusRow({ config }: { config: DeviceConfig }) {
  const now = useNow()
  const { reported } = config
  const lastKnown = reported.online ? null : <span className="ml-1 text-xs text-slate-500">(last known)</span>
  return (
    <dl className="grid gap-4 sm:grid-cols-4">
      <StatusItem label="Status">
        {reported.online ? <Badge tone="green">Online</Badge> : <Badge tone="neutral">Offline</Badge>}
      </StatusItem>
      <StatusItem label="Firmware">
        <span className="font-mono">{reported.fw ?? '-'}</span>
        {lastKnown}
      </StatusItem>
      <StatusItem label="Reporting every">
        {reported.publish_interval_s != null ? `${reported.publish_interval_s} s` : '-'}
        {lastKnown}
      </StatusItem>
      <StatusItem label="Last seen">
        <span title={formatDateTime(reported.last_seen_at)}>{formatRelative(reported.last_seen_at, now)}</span>
      </StatusItem>
    </dl>
  )
}

function SyncStatus({ config, showApplied }: { config: DeviceConfig; showApplied: boolean }) {
  if (!config.synced) {
    const target = config.desired.publish_interval_s
    return (
      <div className="space-y-1" role="status">
        <p className="flex items-center gap-2 text-sm font-medium text-amber-800">
          <Spinner className="h-4 w-4" />
          Pending…{target != null && ` changing to every ${target} s`}
        </p>
        {!config.reported.online && (
          <p className="text-xs text-slate-600">The device is offline. The change will apply when it reconnects.</p>
        )}
      </div>
    )
  }
  if (showApplied) {
    const applied = config.reported.publish_interval_s
    return (
      <p className="text-sm font-medium text-emerald-700" role="status">
        Applied{applied != null && `: reporting every ${applied} s`}
      </p>
    )
  }
  return null
}

function SettingsForm({ deviceId, config }: { deviceId: string; config: DeviceConfig }) {
  const save = useSetPublishInterval(deviceId)
  // null = the user hasn't typed; follow the server value so a poll never clobbers typing.
  const [draft, setDraft] = useState<string | null>(null)
  const [prevSynced, setPrevSynced] = useState(config.synced)
  const [showApplied, setShowApplied] = useState(false)

  // Pending -> synced: flash "Applied" (adjusting state during render, not in an effect).
  if (prevSynced !== config.synced) {
    setPrevSynced(config.synced)
    setShowApplied(config.synced)
  }
  useEffect(() => {
    if (!showApplied) return
    const id = setTimeout(() => setShowApplied(false), APPLIED_VISIBLE_MS)
    return () => clearTimeout(id)
  }, [showApplied])

  const serverValue = config.desired.publish_interval_s ?? config.reported.publish_interval_s
  const text = draft ?? (serverValue != null ? String(serverValue) : '')
  const invalid = validateInterval(text)
  const unchanged = config.synced && text.trim() === String(serverValue)

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (invalid) return
    save.mutate(Number(text.trim()), { onSuccess: () => setDraft(null) })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <div className="flex flex-wrap items-start gap-3">
        <TextField
          label="Publish interval (seconds)"
          type="number"
          inputMode="numeric"
          min={MIN_PUBLISH_INTERVAL_S}
          max={MAX_PUBLISH_INTERVAL_S}
          step={1}
          value={text}
          onChange={(event) => {
            setDraft(event.target.value)
            save.reset()
          }}
          error={draft !== null && invalid ? invalid : undefined}
          hint={`How often the device sends a reading, ${MIN_PUBLISH_INTERVAL_S}–${MAX_PUBLISH_INTERVAL_S} s.`}
          className="w-full sm:w-64"
        />
        <Button type="submit" loading={save.isPending} disabled={invalid !== null || unchanged} className="w-full sm:mt-6 sm:w-auto">
          Save
        </Button>
      </div>
      {save.isError && <Alert tone="error">{saveErrorMessage(save.error)}</Alert>}
      <SyncStatus config={config} showApplied={showApplied} />
    </form>
  )
}

function PanelBody({ deviceId }: { deviceId: string }) {
  const query = useDeviceConfig(deviceId)
  if (query.isPending) {
    return (
      <p className="flex items-center gap-2 text-sm text-slate-500" role="status">
        <Spinner className="h-4 w-4" /> Loading device settings…
      </p>
    )
  }
  if (query.isError && !query.data) {
    const notFound = getErrorStatus(query.error) === 404
    return (
      <div className="space-y-3">
        <Alert tone={notFound ? 'warning' : 'error'}>
          {notFound
            ? 'Device not found or not paired. It may not have connected yet.'
            : getErrorMessage(query.error, "Couldn't load device settings.")}
        </Alert>
        {!notFound && (
          <Button variant="secondary" size="sm" onClick={() => void query.refetch()}>
            Try again
          </Button>
        )}
      </div>
    )
  }
  const config = query.data
  return (
    <div className="space-y-5">
      <StatusRow config={config} />
      <hr className="border-slate-200" />
      <SettingsForm key={deviceId} deviceId={deviceId} config={config} />
    </div>
  )
}

/** Admin-only remote configuration for a site's device. Renders nothing for other roles. */
export function DeviceSettingsPanel({ deviceId }: { deviceId: string | null }) {
  const canManage = isAdmin(useCurrentUser())
  if (!canManage) return null
  return (
    <Card>
      <h2 className="mb-4 font-semibold">Device settings</h2>
      {deviceId ? (
        <PanelBody deviceId={deviceId} />
      ) : (
        <p className="text-sm text-slate-600">
          No device paired. Use “Pair device” at the top of this page to link one.
        </p>
      )}
    </Card>
  )
}
