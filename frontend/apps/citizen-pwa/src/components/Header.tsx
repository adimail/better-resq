import { useState } from 'react'
import { Bell, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { UserDrawer } from './UserDrawer'
import { AppLink } from './AppLink'
import { LocationPickerModal } from './LocationPickerModal'
import { useAppStore } from '../store/useAppStore'
import { useNotifications } from '../hooks/useNotifications'
import { authService } from '@resq/api-client'
import { Button } from '@resq/ui-kit'

export const Header = () => {
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const locationName = useAppStore((state) => state.locationName)
  const location = useAppStore((state) => state.currentLocation)
  const isManualLocation = useAppStore((state) => state.isManualLocation)
  const setLocation = useAppStore((state) => state.setLocation)
  const { unreadCount } = useNotifications()

  const requestLocation = async () => {
    if (location) {
      toast.success('Location is active')
      return
    }

    if (!navigator.geolocation) {
      toast.error('Location not supported by device')
      return
    }

    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({
          name: 'geolocation' as PermissionName,
        })
        if (result.state === 'denied') {
          toast.error('Location access blocked', {
            description:
              'Click the lock icon in your browser URL bar to allow location access, then refresh.',
            duration: 8000,
          })
          return
        }
      } catch (e) {}
    }

    toast.loading('Requesting location access...', { id: 'location-request' })

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        const name = `${nextLocation.lat.toFixed(4)}, ${nextLocation.lng.toFixed(4)}`
        setLocation(nextLocation, name)
        toast.success('Location access granted', { id: 'location-request' })

        if (localStorage.getItem('access_token')) {
          authService.updateDevice({ location: nextLocation }).catch(() => {})
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          toast.error('Permission denied', {
            description:
              'Click the lock icon in your browser URL bar to allow location access.',
            id: 'location-request',
            duration: 8000,
          })
        } else {
          toast.error('Failed to get location', { id: 'location-request' })
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }

  return (
    <header className="sticky top-0 z-[150] h-16 bg-surface border-b border-[var(--color-border)] px-4 flex items-center justify-between transition-none">
      <AppLink
        to="/"
        className="flex items-center gap-2 text-primary no-underline shrink-0"
      >
        <span className="font-extrabold uppercase tracking-tighter text-lg">
          ResQ
        </span>
      </AppLink>

      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          if (isManualLocation || (!location && navigator.geolocation)) {
            setShowLocationPicker(true)
          } else if (!location) {
            requestLocation()
          } else {
            toast.success('Location is active')
          }
        }}
        className="flex-1 justify-center min-w-0 px-3"
        aria-label="Request location"
      >
        <div className="flex items-center gap-1.5 text-text-muted font-bold text-xs uppercase">
          {isManualLocation ? (
            <MapPin className="h-4 w-4 shrink-0 text-warning" />
          ) : (
            <span
              className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                location ? 'bg-success' : 'bg-warning animate-pulse'
              }`}
            />
          )}
          <span className="truncate">
            {locationName}
            <span className="text-[10px] text-text-muted">
            {isManualLocation && (
              <>
                <br />
                (Manual)
              </>
            )}
            </span>
          </span>
        </div>
      </Button>

      <LocationPickerModal
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
      />

      <div className="flex items-center gap-1">
        <AppLink
          to={'/notifications' as any}
          ariaLabel={`${unreadCount} unread notifications`}
          className="relative flex h-11 w-11 items-center justify-center rounded-md text-text-main no-underline active:bg-black/5"
        >
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 min-w-5 rounded-full bg-danger px-1.5 py-0.5 text-center text-[10px] font-black leading-none text-white">
              {unreadCount}
            </span>
          )}
        </AppLink>

        <UserDrawer />
      </div>
    </header>
  )
}
