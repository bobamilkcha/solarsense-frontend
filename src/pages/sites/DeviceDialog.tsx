import { useState } from 'react'
import { getErrorMessage, getErrorStatus } from '../../api/errors'
import type { Site, UnpairedDevice } from '../../api/types'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { ErrorState, LoadingState } from '../../components/ui/States'
import { useNow } from '../../hooks/useNow'
import { usePairDevice, useUnpairDevice, useUnpairedDevices } from '../../hooks/useProjects'
import { formatRelative } from '../../lib/format'

const SIGNAL_LABEL: Record<UnpairedDevice['signal'], string> = {
  good: 'Good signal',
  fair: 'Fair signal',
  weak: 'Weak signal',
  unknown: 'Signal unknown',
}

function DeviceForm({ site, onDone }: { site: Site; onDone: () => void }) {
  const devices = useUnpairedDevices(true)
  const pair = usePairDevice(site.id)
  const unpair = useUnpairDevice(site.id)
  const now = useNow(5_000)
  const [selected, setSelected] = useState<string | null>(null)
  const changing = Boolean(site.device_id)

  const error = pair.error ?? unpair.error
  const message =
    getErrorStatus(error) === 409
      ? 'That device is paired to another site. Unpair it from that site first.'
      : getErrorMessage(error)

  return (
    <div className="space-y-4">
      {(pair.isError || unpair.isError) && <Alert tone="error">{message}</Alert>}
      {changing && (
        <p className="text-sm text-slate-600">
          Current device: <span className="font-mono">{site.device_id}</span>. It is released as soon as you pick a new
          one. Past readings stay on this site.
        </p>
      )}
      <p className="text-sm text-slate-600">
        Switch the device on and wait for Wi-Fi (about 30 s), then pick the code that matches its sticker.
      </p>

      {devices.isPending ? (
        <LoadingState label="Looking for devices…" />
      ) : devices.isError ? (
        <ErrorState error={devices.error} title="Couldn't look for devices" onRetry={() => devices.refetch()} />
      ) : devices.data.length === 0 ? (
        <Alert tone="info">No unpaired device is online. Check its power and Wi-Fi. This list refreshes every few seconds.</Alert>
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg ring-1 ring-slate-200" role="radiogroup" aria-label="Unpaired devices">
          {devices.data.map((d) => (
            <li key={d.device_id}>
              <label className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-amber-50/50">
                <input
                  type="radio"
                  name="device"
                  checked={selected === d.device_id}
                  onChange={() => setSelected(d.device_id)}
                />
                <span className="font-mono text-base font-semibold">{d.short_code}</span>
                <span className="ml-auto text-right text-xs text-slate-500">
                  {SIGNAL_LABEL[d.signal]} · seen {formatRelative(d.last_seen_at, now)}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap justify-between gap-2 pt-2">
        {changing ? (
          <Button variant="secondary" loading={unpair.isPending} onClick={() => unpair.mutate(undefined, { onSuccess: onDone })}>
            Unpair device
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onDone}>
            Cancel
          </Button>
          <Button
            disabled={!selected}
            loading={pair.isPending}
            onClick={() => selected && pair.mutate(selected, { onSuccess: onDone })}
          >
            {changing ? 'Change device' : 'Pair device'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function DeviceDialog({ site, open, onClose }: { site: Site; open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={site.device_id ? 'Change device' : 'Pair a device'}>
      <DeviceForm site={site} onDone={onClose} />
    </Modal>
  )
}
