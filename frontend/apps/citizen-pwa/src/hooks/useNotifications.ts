import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationService } from '@resq/api-client'
import { useAppStore } from '../store/useAppStore'

export const useNotifications = () => {
  const queryClient = useQueryClient()
  const storeNotifications = useAppStore((state) => state.notifications)
  const setNotifications = useAppStore((state) => state.setNotifications)
  const isAuthenticated = Boolean(localStorage.getItem('access_token'))

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.list({ limit: 50 }),
    enabled: isAuthenticated,
    retry: false,
  })

  useEffect(() => {
    if (query.data?.data) {
      setNotifications(query.data.data)
    }
  }, [query.data, setNotifications])

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await notificationService.markRead(id)
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] })
      const previous = queryClient.getQueryData<any>(['notifications'])
      
      if (previous?.data) {
        queryClient.setQueryData(['notifications'], {
          ...previous,
          data: previous.data.map((n: any) =>
            n.id === id ? { ...n, read_at: new Date().toISOString() } : n
          ),
        })
      }
      return { previous }
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications'], context.previous)
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unreadCount = storeNotifications.filter((item) => !item.read_at).length

  return {
    notifications: storeNotifications,
    unreadCount,
    isLoading: query.isLoading,
    isError: query.isError,
    isAuthenticated,
    markRead,
  }
}