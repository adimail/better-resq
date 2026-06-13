import { createRoute, useNavigate, useParams } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { useQuery } from '@tanstack/react-query'
import { api } from '@resq/api-client'
import { Card, Badge, Skeleton, Button } from '@resq/ui-kit'
import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import {
  ChevronLeft,
  MapPin,
  Clock,
  AlertTriangle,
  Image as ImageIcon,
} from 'lucide-react'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/triage/$id',
  component: IncidentDetailPage,
})

const style: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: 'OpenStreetMap',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
}

function IncidentDetailPage() {
  const { id } = useParams({ from: Route.id })
  const navigate = useNavigate()
  const miniContainerRef = useRef<HTMLDivElement>(null)
  const miniMapRef = useRef<maplibregl.Map | null>(null)

  const { data: incident, isLoading } = useQuery({
    queryKey: ['admin-incident', id],
    queryFn: async () => {
      const res = await api.get(`/incidents/${id}`)
      return res.data
    },
  })

  useEffect(() => {
    if (!incident || !miniContainerRef.current) return
    if (miniMapRef.current) {
      miniMapRef.current.remove()
      miniMapRef.current = null
    }
    const map = new maplibregl.Map({
      container: miniContainerRef.current,
      style,
      center: [incident.location.lng, incident.location.lat],
      zoom: 14,
      interactive: false,
      attributionControl: false,
    })
    miniMapRef.current = map
    map.on('load', () => {
      const el = document.createElement('div')
      el.className =
        'w-6 h-6 bg-danger rounded-full border-2 border-white shadow-lg'
      new maplibregl.Marker({ element: el })
        .setLngLat([incident.location.lng, incident.location.lat])
        .addTo(map)
    })
    return () => {
      map.remove()
      miniMapRef.current = null
    }
  }, [incident])

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex flex-col p-8 max-w-4xl mx-auto w-full gap-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="absolute inset-0 flex flex-col p-8 max-w-4xl mx-auto w-full">
        <Card className="border-danger bg-danger/10 text-center py-8">
          <p className="text-sm font-black uppercase text-danger">
            Incident not found
          </p>
          <Button
            variant="ghost"
            className="mt-4"
            onClick={() => navigate({ to: '/triage' })}
          >
            Back to Triage
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex flex-col p-8 overflow-y-auto max-w-4xl mx-auto w-full gap-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="p-2"
          onClick={() => navigate({ to: '/triage' })}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-danger" />
            {incident.disaster_type.replace('_', ' ')}
          </h1>
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest">
            Incident Detail
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col gap-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Location
          </h3>
          <div className="h-48 rounded-lg overflow-hidden border border-[var(--color-border)]">
            <div ref={miniContainerRef} className="w-full h-full" />
          </div>
          <p className="text-xs font-bold text-text-muted">
            {incident.location.lat.toFixed(5)},{' '}
            {incident.location.lng.toFixed(5)}
          </p>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <h3 className="text-xs font-black uppercase tracking-widest text-text-muted mb-3">
              Status
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--color-surface-muted)] rounded-lg p-3">
                <p className="text-[10px] font-black uppercase text-text-muted">
                  Status
                </p>
                <Badge
                  variant={
                    incident.status === 'VERIFIED'
                      ? 'success'
                      : incident.status === 'REJECTED'
                        ? 'danger'
                        : 'warning'
                  }
                >
                  {incident.status}
                </Badge>
              </div>
              <div className="bg-[var(--color-surface-muted)] rounded-lg p-3">
                <p className="text-[10px] font-black uppercase text-text-muted">
                  AI Confidence
                </p>
                <p className="text-lg font-black">
                  {(incident.ai_confidence_score * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-xs font-black uppercase tracking-widest text-text-muted mb-2">
              Description
            </h3>
            <p className="text-sm font-bold bg-[var(--color-surface-muted)] rounded-lg p-3">
              {incident.description || 'No description'}
            </p>
            {incident.image_url && (
              <div className="mt-3">
                <p className="text-[10px] font-black uppercase text-text-muted mb-2 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" /> Attached Image
                </p>
                <img
                  src={incident.image_url}
                  alt="Incident"
                  className="w-full h-40 object-cover rounded-lg border border-[var(--color-border)]"
                />
              </div>
            )}
          </Card>

          <div className="flex items-center gap-2 text-xs font-bold text-text-muted">
            <Clock className="w-4 h-4" />
            Reported: {new Date(incident.created_at).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  )
}
