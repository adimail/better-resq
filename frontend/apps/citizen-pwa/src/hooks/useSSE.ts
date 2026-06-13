import { useEffect } from 'react'
import { api } from '@resq/api-client'
import type { AppNotification, Location } from '@resq/types'
import { useAppStore } from '../store/useAppStore'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

export const useSSE = (location?: Location) => {
  const pushNotification = useAppStore((state) => state.pushNotification)
  const activeSosId = useAppStore((state) => state.activeSosId)
  const setActiveSos = useAppStore((state) => state.setActiveSos)
  const clearActiveSos = useAppStore((state) => state.clearActiveSos)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!location) return

    const token = localStorage.getItem('access_token') || 'anonymous'
    const baseURL = api.defaults.baseURL ?? ''
    const url = new URL(`${baseURL}/stream/events`)
    url.searchParams.set('lat', String(location.lat))
    url.searchParams.set('lng', String(location.lng))
    url.searchParams.set('radius', '5000')
    url.searchParams.set('token', token)

    const source = new EventSource(url.toString())

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)

        switch (payload.event) {
          case 'DANGER_ZONE_ACTIVE':
          case 'INCIDENT_VERIFIED':
            queryClient.invalidateQueries({ queryKey: ['danger-zones'] })
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
            toast.error('New Hazard Detected Nearby!', { duration: 5000 })
            break
          case 'CAMP_CREATED':
          case 'CAMP_STOCK_UPDATED':
            queryClient.invalidateQueries({ queryKey: ['camps'] })
            if (payload.event === 'CAMP_CREATED') {
              toast.success(`New ${payload.type} camp deployed: ${payload.name}`)
            }
            break
          case 'SOS_UPDATED':
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
            if (payload.id === activeSosId) {
              if (payload.status === 'resolved' || payload.status === 'RESOLVED') {
                clearActiveSos()
                toast.success('Emergency resolved by responders.', { duration: 10000 })
              } else {
                setActiveSos(payload.id, payload.status)
              }
            }
            break
          case 'BROADCAST_SENT':
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
            break
        }

        const notification = payload.notification ?? payload
        if (
          notification?.id &&
          notification?.title &&
          notification?.message &&
          notification?.severity
        ) {
          pushNotification(notification as AppNotification)
          if (notification.severity === 'danger' || notification.severity === 5) {
            toast.error(`${notification.title}: ${notification.message}`, { duration: 10000 })
          } else if (notification.severity === 'success') {
            toast.success(`${notification.title}: ${notification.message}`, { duration: 5000 })
          } else {
            toast.info(`${notification.title}: ${notification.message}`)
          }
        }
      } catch {
        return
      }
    }

    return () => source.close()
  }, [location, pushNotification, activeSosId, setActiveSos, clearActiveSos, queryClient])
}