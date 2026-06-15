import { createRoute, useNavigate, useParams } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { useQuery } from '@tanstack/react-query'
import { api, mapService } from '@resq/api-client'
import { Card, Badge, Skeleton, Button } from '@resq/ui-kit'
import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import {
  ChevronLeft,
  MapPin,
  Package,
  Navigation,
  Building2,
} from 'lucide-react'
import { useMap } from '../hooks/useMap'
import { useAppStore } from '../store/useAppStore'
import { toast } from 'sonner'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/camps/$id',
  component: CampDetailPage,
})

function CampDetailPage() {
  const { id } = useParams({ from: Route.id })
  const navigate = useNavigate()
  const currentLocation = useAppStore((state) => state.currentLocation)
  const setActiveRoute = useAppStore((state) => state.setActiveRoute)
  const setActiveRouteTarget = useAppStore(
    (state) => state.setActiveRouteTarget,
  )
  const [isRouting, setIsRouting] = useState(false)

  const { data: camp, isLoading } = useQuery({
    queryKey: ['camp', id],
    queryFn: async () => {
      const res = await api.get(`/camps/${id}`)
      return res.data
    },
  })

  const { mapContainer, mapRef, isLoaded } = useMap({
    center: camp ? [camp.location.lng, camp.location.lat] : [73.8567, 18.5204],
    zoom: 14,
    interactive: false,
  })

  const markerRef = useRef<maplibregl.Marker | null>(null)

  useEffect(() => {
    if (!camp || !isLoaded || !mapRef.current) return

    if (markerRef.current) {
      markerRef.current.remove()
    }

    const el = document.createElement('div')
    el.className =
      'w-6 h-6 bg-success rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white'

    markerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat([camp.location.lng, camp.location.lat])
      .addTo(mapRef.current)

    mapRef.current.setCenter([camp.location.lng, camp.location.lat])

    return () => {
      markerRef.current?.remove()
      markerRef.current = null
    }
  }, [camp, isLoaded])

  const handleGetRoute = async () => {
    if (!currentLocation || !camp) {
      toast.error('Location unavailable')
      return
    }
    setIsRouting(true)
    try {
      const originStr = `${currentLocation.lat},${currentLocation.lng}`
      const destStr = `${camp.location.lat},${camp.location.lng}`
      const route = await mapService.getSafeRoute(originStr, destStr, 'driving')
      setActiveRoute(route)
      setActiveRouteTarget(camp.location)
      navigate({ to: '/map' })
    } catch (e) {
      toast.error('Could not calculate a safe route to this camp')
    } finally {
      setIsRouting(false)
    }
  }

  if (isLoading) {
    return (
      <main className="p-4 flex flex-col gap-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-24 w-full" />
      </main>
    )
  }

  if (!camp) {
    return (
      <main className="p-4 flex flex-col gap-4">
        <Card className="border-danger bg-danger/10 text-center py-8">
          <p className="text-sm font-black uppercase text-danger">
            Camp not found
          </p>
          <Button
            variant="ghost"
            className="mt-4"
            onClick={() => navigate({ to: '/camps' })}
          >
            Back to Camps
          </Button>
        </Card>
      </main>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg-base)] pb-20">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-surface border-b border-[var(--color-border)] p-4">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 p-2 shrink-0 text-text-main hover:bg-black/5"
          onClick={() => navigate({ to: '/camps' })}
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-black uppercase tracking-tight truncate text-text-main">
            {camp.name}
          </h1>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            {camp.camp_type} Camp
          </p>
        </div>
      </header>

      <main className="flex-1 flex flex-col gap-4 p-4">
        <div className="relative h-56 w-full rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-map-land)] shrink-0 shadow-sm">
          <div ref={mapContainer} className="h-full w-full" />
          <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
            <Card className="p-2.5 bg-surface/90 backdrop-blur shadow-md flex items-center justify-between border-[var(--color-border)] rounded-lg">
              <span className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Coordinates
              </span>
              <span className="text-[11px] font-bold font-mono text-text-main">
                {camp.location.lat.toFixed(4)}, {camp.location.lng.toFixed(4)}
              </span>
            </Card>
          </div>
        </div>

        <Card className="flex flex-col gap-3 shadow-sm border-[var(--color-border)]">
          <span className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" /> Inventory Status
          </span>
          <div className="flex items-center gap-3">
            <Badge
              className="px-3 py-1.5 text-xs"
              variant={
                camp.stock_status === 'fully_stocked'
                  ? 'success'
                  : camp.stock_status === 'low'
                    ? 'warning'
                    : 'danger'
              }
            >
              {camp.stock_status.replace('_', ' ')}
            </Badge>
          </div>
        </Card>
      </main>

      <div className="fixed bottom-16 left-0 right-0 p-4 bg-surface border-t border-[var(--color-border)] z-10 pb-6">
        <Button
          onClick={handleGetRoute}
          isLoading={isRouting}
          className="flex h-14 w-full items-center justify-center rounded-md bg-primary text-sm font-black uppercase tracking-widest text-white shadow-lg"
        >
          <Navigation className="w-5 h-5 mr-2" />
          Get Safe Route
        </Button>
      </div>
    </div>
  )
}

