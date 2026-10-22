import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listBills, uploadBill } from '../api/bills'
import { queryKeys } from './queryKeys'

export function useBills(siteId: string) {
  return useQuery({ queryKey: queryKeys.bills(siteId), queryFn: () => listBills(siteId) })
}

export function useUploadBill(siteId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => uploadBill(siteId, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.bills(siteId) })
      // Feasibility depends on bills.
      void queryClient.invalidateQueries({ queryKey: ['sites', siteId, 'feasibility'] })
    },
  })
}
