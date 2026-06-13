import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, mapService, sosService } from '@resq/api-client'
import { toast } from 'sonner'
import type { IncidentReport } from '@resq/types'

export function useAdminIncidents() {
  const queryClient = useQueryClient()

  const query = useQuery<IncidentReport[]>({
    queryKey: ['admin-incidents'],
    queryFn: async () => {
      try {
        const res = await api.get('/incidents')
        return res.data || []
      } catch {
        return []
      }
    },
  })

  const verifyMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/incidents/${id}/status`, { status }),
  })

  return { ...query, verifyMutation, queryClient }
}

export function useAdminCamps() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['admin-camps'],
    queryFn: () => mapService.getCamps('-180,-90,180,90'),
  })

  const updateStockMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/camps/${id}`, { stock_status: status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-camps'] })
      const previous = queryClient.getQueryData<any[]>(['admin-camps'])
      if (previous) {
        queryClient.setQueryData(
          ['admin-camps'],
          previous.map((c) =>
            c.id === id ? { ...c, stock_status: status } : c,
          ),
        )
      }
      return { previous }
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['admin-camps'], context.previous)
      }
      toast.error('Failed to update stock status')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-camps'] })
    },
  })

  return { ...query, updateStockMutation, queryClient }
}

export function useAdminSOS(statusFilter: string = 'active') {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['admin-sos', statusFilter],
    queryFn: () => sosService.list({ status: statusFilter, limit: 100 }),
    refetchInterval: 10000,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      sosService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sos'] })
    },
  })

  return { ...query, updateMutation, queryClient }
}

export function useAdminDangerZones() {
  return useQuery({
    queryKey: ['admin-danger-zones'],
    queryFn: () => mapService.getDangerZones('-180,-90,180,90'),
  })
}