import { useEffect, useRef, useState } from 'react'
import { createRoute, useNavigate } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { useAuth as useAuthActions } from '../hooks/useAuth'
import { Button, Card, PageSkeleton } from '@resq/ui-kit'
import {
  UserCircle,
  Phone,
  Mail,
  Shield,
  Calendar,
  LogOut,
  ChevronLeft,
  Radio,
  MapPin,
  Navigation,
  FileText,
} from 'lucide-react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useAppStore } from '../store/useAppStore'
import type { Location } from '@resq/types'
import { useMap } from '../hooks/useMap'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: ProfilePage,
})

function ProfilePage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isProfileLoading, logout } = useAuthActions()

  const currentLocation = useAppStore((state) => state.currentLocation)
  const locationName = useAppStore((state) => state.locationName)
  const isManualLocation = useAppStore((state) => state.isManualLocation)
  const setLocation = useAppStore((state) => state.setLocation)

  const [pickedLocation, setPickedLocation] = useState<Location | null>(null)

  const { mapContainer, mapRef, isLoaded } = useMap({
    center: currentLocation
      ? [currentLocation.lng, currentLocation.lat]
      : [73.8567, 18.5204],
    zoom: currentLocation ? 14 : 11,
  })

  const markerRef = useRef<maplibregl.Marker | null>(null)

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !isAuthenticated || !user) return

    const map = mapRef.current

    const onClick = (e: maplibregl.MapMouseEvent) => {
      const loc = {
        lat: e.lngLat.lat,
        lng: e.lngLat.lng,
      }

      setPickedLocation(loc)

      if (!markerRef.current) {
        const el = document.createElement('div')
        el.className =
          'flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-primary shadow-lg'

        markerRef.current = new maplibregl.Marker({
          element: el,
        })
          .setLngLat([loc.lng, loc.lat])
          .addTo(map)
      } else {
        markerRef.current.setLngLat([loc.lng, loc.lat])
      }
    }

    map.on('click', onClick)

    return () => {
      map.off('click', onClick)
    }
  }, [isLoaded, isAuthenticated, user])

  useEffect(() => {
    if (!mapRef.current || !currentLocation || !isLoaded) return
    mapRef.current.easeTo({
      center: [currentLocation.lng, currentLocation.lat],
      zoom: 13,
    })
  }, [currentLocation, isLoaded])

  const handleSaveLocation = () => {
    if (pickedLocation) {
      setLocation(
        pickedLocation,
        `${pickedLocation.lat.toFixed(4)}, ${pickedLocation.lng.toFixed(4)}`,
        true,
      )
      setPickedLocation(null)
    }
  }

  if (isProfileLoading) {
    return <PageSkeleton />
  }

  const memberSince = user?.created_at
    ? new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(user.created_at))
    : undefined

  return (
    <main className="flex flex-col gap-6 p-4 pb-6">
      <header className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 p-2 text-text-main"
          onClick={() => navigate({ to: '/' })}
          aria-label="Back to home"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-black uppercase tracking-tight">
          Profile
        </h1>
      </header>

      {isAuthenticated && user ? (
        <section className="flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <UserCircle className="h-12 w-12 text-primary" aria-hidden="true" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-black uppercase tracking-tight">
              {user.full_name}
            </h2>
            {user.role && (
              <span className="text-xs font-black uppercase tracking-widest text-text-muted">
                {user.role === 'CITIZEN' ? 'Citizen' : user.role}
              </span>
            )}
          </div>
        </section>
      ) : (
        <Card className="flex flex-col items-center justify-center gap-4 py-8">
          <UserCircle
            className="h-16 w-16 text-text-muted"
            aria-hidden="true"
          />
          <div className="text-center">
            <h2 className="text-xl font-black uppercase tracking-tight">
              Not Signed In
            </h2>
            <p className="mt-1 text-sm font-bold text-text-muted">
              Sign in to view your profile and SOS history.
            </p>
          </div>
          <Button
            size="lg"
            className="w-full"
            onClick={() => navigate({ to: '/auth/login' })}
          >
            Sign In
          </Button>
        </Card>
      )}

      {isAuthenticated && user ? (
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <div className="flex flex-col gap-6">
            <Card className="flex flex-col gap-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-text-muted">
                Account Details
              </h3>

              <div className="flex items-center gap-3">
                <Phone
                  className="h-5 w-5 shrink-0 text-text-muted"
                  aria-hidden="true"
                />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-text-muted">
                    Phone
                  </span>
                  <span className="text-sm font-bold">{user.phone_number}</span>
                </div>
              </div>

              {user.email && (
                <div className="flex items-center gap-3">
                  <Mail
                    className="h-5 w-5 shrink-0 text-text-muted"
                    aria-hidden="true"
                  />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-text-muted">
                      Email
                    </span>
                    <span className="text-sm font-bold">{user.email}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Shield
                  className="h-5 w-5 shrink-0 text-text-muted"
                  aria-hidden="true"
                />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-text-muted">
                    Role
                  </span>
                  <span className="text-sm font-bold">{user.role}</span>
                </div>
              </div>

              {memberSince && (
                <div className="flex items-center gap-3">
                  <Calendar
                    className="h-5 w-5 shrink-0 text-text-muted"
                    aria-hidden="true"
                  />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-text-muted">
                      Member Since
                    </span>
                    <span className="text-sm font-bold">{memberSince}</span>
                  </div>
                </div>
              )}
            </Card>

            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={() => navigate({ to: '/sos-history' })}
                >
                  <Radio className="mr-2 h-5 w-5 shrink-0" />
                  SOS History
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={() => navigate({ to: '/my-reports' })}
                >
                  <FileText className="mr-2 h-5 w-5 shrink-0" />
                  My Reports
                </Button>
              </div>

              <Button
                variant="danger"
                size="lg"
                className="w-full"
                disabled={logout.isPending}
                isLoading={logout.isPending}
                onClick={() => logout.mutate()}
              >
                <LogOut className="mr-2 h-5 w-5 shrink-0" />
                Sign Out
              </Button>
            </div>
          </div>

          <Card className="flex flex-col gap-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-text-muted">
              Location Settings
            </h3>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Navigation className="h-5 w-5 shrink-0 text-text-muted" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-text-muted">
                    Current Source
                  </span>
                  <span className="text-sm font-bold">
                    {isManualLocation ? 'Custom Location' : 'GPS / Auto'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 shrink-0 text-text-muted" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-text-muted">
                    Active Coordinates
                  </span>
                  <span className="text-sm font-bold">{locationName}</span>
                </div>
              </div>
            </div>

            <p className="mt-2 text-xs font-bold text-text-muted">
              Drag the map or click to drop a pin to set a custom location.
            </p>

            <div className="relative h-64 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-map-land)]">
              <div ref={mapContainer} className="h-full w-full" />
              {!pickedLocation && (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                  <div className="flex items-center gap-2 rounded-full bg-surface/80 px-3 py-1.5 shadow backdrop-blur-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-black uppercase">
                      Click map to place pin
                    </span>
                  </div>
                </div>
              )}
            </div>

            {pickedLocation && (
              <div className="rounded-lg bg-[var(--color-surface-muted)] p-3">
                <p className="text-[10px] font-black uppercase text-text-muted">
                  Selected Coordinates
                </p>
                <p className="text-sm font-black">
                  {pickedLocation.lat.toFixed(5)},{' '}
                  {pickedLocation.lng.toFixed(5)}
                </p>
              </div>
            )}

            <Button
              variant="primary"
              className="w-full"
              disabled={!pickedLocation}
              onClick={handleSaveLocation}
            >
              Save Custom Location
            </Button>
          </Card>
        </div>
      ) : null}
    </main>
  )
}

