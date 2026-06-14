import { createRoute } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { mapService } from '@resq/api-client'
import { Card } from '@resq/ui-kit'
import { ArrowLeft, AlertTriangle, MapPin, Clock } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useMap } from '../hooks/useMap'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/hazards/$id',
  component: HazardDetail,
})

function HazardDetail() {
  const { id } = useParams({ from: '/hazards/$id' })
  const navigate = useNavigate()

  const { data: hazard, isLoading } = useQuery({
    queryKey: ['danger-zone', id],
    queryFn: () => mapService.getDangerZoneById(id),
  })

  const { mapContainer, mapRef, isLoaded } = useMap({
    interactive: false,
    zoom: 14,
  })

  useEffect(() => {
    if (!mapRef.current || !isLoaded || !hazard) return

    const map = mapRef.current
    const lng = hazard.boundary_polygon?.[0]?.[0]?.[0] || 73.8567
    const lat = hazard.boundary_polygon?.[0]?.[0]?.[1] || 18.5204

    map.setCenter([lng, lat])

    if (!map.getSource('hazard-polygon')) {
      map.addSource('hazard-polygon', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: hazard.boundary_polygon,
          },
        },
      })

      map.addLayer({
        id: 'hazard-polygon-fill',
        type: 'fill',
        source: 'hazard-polygon',
        paint: {
          'fill-color': '#b91c1c',
          'fill-opacity': 0.3,
        },
      })

      map.addLayer({
        id: 'hazard-polygon-line',
        type: 'line',
        source: 'hazard-polygon',
        paint: {
          'line-color': '#7f1d1d',
          'line-width': 2,
        },
      })
    }
  }, [isLoaded, hazard, mapRef])

  if (isLoading) {
    return (
      <div className="p-6 text-center font-black uppercase tracking-widest text-text-muted">
        Loading hazard information...
      </div>
    )
  }

  if (!hazard) {
    return (
      <div className="p-6 text-center font-black uppercase tracking-widest text-danger">
        Hazard not found
      </div>
    )
  }

  const lat = hazard.boundary_polygon?.[0]?.[0]?.[1] || 0
  const lng = hazard.boundary_polygon?.[0]?.[0]?.[0] || 0

  return (
    <div className="max-w-xl mx-auto p-5 pb-24">
      <button
        onClick={() => navigate({ to: '/map' })}
        className="flex items-center gap-2 text-xs font-black uppercase tracking-widest mb-6 text-text-muted hover:text-text-main"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Map
      </button>

      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="w-9 h-9 text-danger" />
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">
            Danger Zone
          </h1>
          <p className="text-danger font-bold uppercase tracking-widest text-sm mt-1">
            {hazard.disaster_type?.replace('_', ' ')}
          </p>
        </div>
      </div>

      <Card className="p-0 overflow-hidden mb-6 flex flex-col">
        <div className="p-5 pb-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase tracking-widest font-black text-text-muted">
              Severity
            </span>
            <span className="px-4 py-1 bg-danger/10 text-danger rounded-full font-black text-xs uppercase tracking-widest">
              Level {hazard.severity_level}
            </span>
          </div>
        </div>

        <div className="h-56 w-full border-y border-[var(--color-border)] bg-[var(--color-map-land)] relative">
          <div ref={mapContainer} className="absolute inset-0 h-full w-full" />
        </div>

        <div className="p-5 pt-4">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-danger flex-shrink-0" />
            <div className="text-sm font-bold font-mono">
              {lat.toFixed(4)}, {lng.toFixed(4)}
              <div className="text-[10px] font-black uppercase tracking-widest text-text-muted mt-1 font-sans">
                Boundary Coordinates
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">
          <Clock className="w-4 h-4" />
          Established{' '}
          {new Date(hazard.created_at || Date.now()).toLocaleDateString(
            'en-IN',
          )}
        </div>
        <div className="text-xs font-bold text-text-main leading-relaxed">
          This area has been marked as a danger zone by authorities. Stay safe,
          follow local instructions, and avoid traveling through this boundary.
        </div>
      </Card>
    </div>
  )
}
