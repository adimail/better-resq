import { createRoute } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { mapService } from '@resq/api-client'
import { Card } from '@resq/ui-kit'
import { ArrowLeft, AlertTriangle, MapPin, Map } from 'lucide-react'
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

  const { mapContainer, mapRef, isLoaded } = useMap([73.8567, 18.5204], 14)

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
      <div className="p-8 text-center uppercase font-black text-text-muted">
        Loading hazard details...
      </div>
    )
  }

  if (!hazard) {
    return (
      <div className="p-8 text-center uppercase font-black text-danger">
        Hazard not found
      </div>
    )
  }

  const lat = hazard.boundary_polygon?.[0]?.[0]?.[1] || 0
  const lng = hazard.boundary_polygon?.[0]?.[0]?.[0] || 0

  return (
    <div className="max-w-4xl mx-auto p-6 w-full">
      <button
        onClick={() => navigate({ to: '/command-center' })}
        className="flex items-center gap-2 text-sm font-bold mb-6 hover:text-primary transition-colors uppercase tracking-widest text-text-muted"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Command Center
      </button>

      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-danger" />
            <h1 className="text-3xl font-black tracking-tight uppercase">
              Danger Zone Alert
            </h1>
          </div>
          <p className="text-xl text-text-main mt-1 uppercase font-bold tracking-widest">
            {hazard.disaster_type?.replace('_', ' ')}
          </p>
        </div>
        <div
          className={`px-4 py-2 rounded-full font-black text-sm uppercase tracking-widest ${hazard.severity_level >= 4 ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}
        >
          Severity {hazard.severity_level}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-0 overflow-hidden flex flex-col">
            <div className="p-6 pb-4">
              <h2 className="font-black uppercase tracking-widest text-xs text-text-muted">
                Hazard Boundary Map
              </h2>
            </div>
            <div className="h-80 w-full border-y border-[var(--color-border)] bg-[var(--color-map-land)] relative">
              <div
                ref={mapContainer}
                className="absolute inset-0 h-full w-full"
              />
            </div>
            <div className="p-6 pt-4">
              <div className="flex items-center gap-3 text-text-main">
                <MapPin className="w-5 h-5 text-danger" />
                <div>
                  <div className="font-mono text-sm font-bold">
                    {lat.toFixed(5)}, {lng.toFixed(5)}
                  </div>
                  <div className="text-xs font-bold text-text-muted mt-1 uppercase tracking-widest">
                    Polygon Boundary Origin
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-black uppercase tracking-widest text-xs mb-4 text-text-muted">
              Status Timeline
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-success mt-2" />
                <div className="flex-1">
                  <div className="font-black uppercase tracking-widest text-sm">
                    Zone Established
                  </div>
                  <div className="text-xs font-bold text-text-muted uppercase">
                    {new Date(hazard.created_at || Date.now()).toLocaleString(
                      'en-IN',
                    )}
                  </div>
                </div>
              </div>
              {hazard.expires_at && (
                <div className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-warning mt-2" />
                  <div className="flex-1">
                    <div className="font-black uppercase tracking-widest text-sm">
                      Scheduled Expiration
                    </div>
                    <div className="text-xs font-bold text-text-muted uppercase">
                      {new Date(hazard.expires_at).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-black uppercase tracking-widest text-xs mb-4 text-text-muted">
              Zone State
            </h2>
            <div className="flex items-center gap-2 text-2xl font-black text-danger uppercase tracking-tight">
              <Map className="w-6 h-6" />{' '}
              {hazard.is_active ? 'Active' : 'Inactive'}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-black uppercase tracking-widest text-xs mb-4 text-text-muted">
              Actions
            </h2>
            <div className="space-y-3">
              <button className="w-full border border-primary text-primary font-black uppercase tracking-widest py-3 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer">
                Broadcast Alert
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
