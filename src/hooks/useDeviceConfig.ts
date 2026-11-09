import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getDeviceConfig, setDeviceConfig } from '../api/deviceConfig'
import { queryKeys } from './queryKeys'

/** How often to re-check a pending change. */
export const DEVICE_CONFIG_POLL_MS = 3_000

/**
 * Device status and settings. Does nothing without a device ID. Polls only
 * while a change is pending (synced === false), and not in background tabs.
 */
export function useDeviceConfig(deviceId: string | null) {
  return useQuery({
    queryKey: queryKeys.deviceConfig(deviceId ?? ''),
    queryFn: () => getDeviceConfig(deviceId ?? ''),
    enabled: Boolean(deviceId),
    refetchInterval: (query) => (query.state.data?.synced === false ? DEVICE_CONFIG_POLL_MS : false),
    refetchIntervalInBackground: false,
    retry: (count, error) => {
      const status = (error as { response?: { status?: number } }).response?.status
      return status !== 404 && status !== 403 && count < 2
    },
  })
}

export function useSetPublishInterval(deviceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (seconds: number) => setDeviceConfig(deviceId, seconds),
    // The PUT returns the same shape as GET (synced is false), which starts the polling.
    onSuccess: (data) => queryClient.setQueryData(queryKeys.deviceConfig(deviceId), data),
  })
}
