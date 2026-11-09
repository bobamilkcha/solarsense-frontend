import { api } from './client'
import type { DeviceConfig } from './types'

/** Allowed range for the publish interval, in seconds (enforced by the backend and the device). */
export const MIN_PUBLISH_INTERVAL_S = 5
export const MAX_PUBLISH_INTERVAL_S = 3600

export async function getDeviceConfig(deviceId: string): Promise<DeviceConfig> {
  const { data } = await api.get<DeviceConfig>(`/devices/${encodeURIComponent(deviceId)}/config`)
  return data
}

export async function setDeviceConfig(deviceId: string, publishIntervalS: number): Promise<DeviceConfig> {
  const { data } = await api.put<DeviceConfig>(`/devices/${encodeURIComponent(deviceId)}/config`, {
    publish_interval_s: publishIntervalS,
  })
  return data
}
