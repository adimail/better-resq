import { useEffect, useMemo, useState } from 'react'
import { authService } from '@resq/api-client'
import type { Location } from '@resq/types'
import { useAppStore } from '../store/useAppStore'

const formatLocationName = (location?: Location) => {
  if (!location) return 'Location unavailable'
  return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
}

export const useLocation = () => {
  const storeLocation = useAppStore((state) => state.currentLocation)
  const setLocation = useAppStore((state) => state.setLocation)
  const [permissionState, setPermissionState] = useState<
    PermissionState | 'unsupported' | 'unknown'
  >('unknown')
  const [error, setError] = useState<string>()

  useEffect(() => {
    let watchId: number | undefined

    if (!navigator.geolocation) {
      setPermissionState('unsupported')
      setError('Geolocation is not available on this device.')
      if (!useAppStore.getState().isManualLocation) {
        setLocation(undefined, 'Location unavailable')
      }
      return
    }

    navigator.permissions
      ?.query({ name: 'geolocation' as PermissionName })
      .then((permission) => {
        setPermissionState(permission.state)
        permission.onchange = () => setPermissionState(permission.state)
      })
      .catch(() => setPermissionState('unknown'))

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setError(undefined)

        if (!useAppStore.getState().isManualLocation) {
          setLocation(nextLocation, formatLocationName(nextLocation), false)

          if (localStorage.getItem('access_token')) {
            authService.updateDevice({ location: nextLocation }).catch(() => {})
          }
        }
      },
      (geoError) => {
        setError(geoError.message)
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 },
    )

    return () => {
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId)
    }
  }, [setLocation])

  return useMemo(
    () => ({
      location: storeLocation,
      locationName: formatLocationName(storeLocation),
      permissionState,
      error,
      hasLocation: Boolean(storeLocation),
    }),
    [error, storeLocation, permissionState],
  )
}