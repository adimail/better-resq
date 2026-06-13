import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { mapService } from '@resq/api-client'
import type { Location } from '@resq/types'
import { useAppStore } from '../store/useAppStore'

export const toBbox = (location?: Location, delta = 0.05) => {
  if (!location) return undefined
  return [
    location.lng - delta,
    location.lat - delta,
    location.lng + delta,
    location.lat + delta,
  ].join(',')
}

export const useMapResources = (location?: Location) => {
  const setAlerts = useAppStore((state) => state.setAlerts)
  const bbox = toBbox(location)

  const dangerZones = useQuery({
    queryKey: ['danger-zones', bbox],
    queryFn: () => mapService.getDangerZones(bbox!),
    enabled: Boolean(bbox),
  })

  const camps = useQuery({
    queryKey: ['camps', bbox],
    queryFn: () => mapService.getCamps(bbox!),
    enabled: Boolean(bbox),
  })

  useEffect(() => {
    if (dangerZones.data) setAlerts(dangerZones.data)
  }, [dangerZones.data, setAlerts])

  return { bbox, dangerZones, camps }
}
