import { createRoute, useNavigate, useParams } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { useQuery } from '@tanstack/react-query'
import { api } from '@resq/api-client'
import { Card, Badge, Skeleton, Button } from '@resq/ui-kit'
import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { ChevronLeft, MapPin, Package, Clock, Activity } from 'lucide-react'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/logistics/$id',
  component: CampDetailPage,
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

function CampDetailPage() {
  const { id } = useParams({ from: Route.id })
  const navigate = useNavigate()
  const miniContainerRef = useRef<HTMLDivElement>(null)
  const miniMapRef = useRef<maplibregl.Map | null>(null)

  const { data: camp, isLoading } = useQuery({
    queryKey: ['admin-camp', id],
    queryFn: async () => {
      const res = await api.get(`/camps/${id}`)
      return res.data
    },
  })

  // Mini-map
  useEffect(() => {
    if (!camp || !miniContainerRef.current) return
    if (miniMapRef.current) {
      miniMapRef.current.remove()
      miniMapRef.current = null
    }
    const map = new maplibregl.Map({
      container: miniContainerRef.current,
      style,
      center: [camp.location.lng, camp.location.lat],
      zoom: 14,
      interactive: false,
      attributionControl: false,
    })
    miniMapRef.current = map
    map.on('load', () => {
      const el = document.createElement('div')
      el.className =
        'w-6 h-6 bg-success rounded-lg border-2 border-white shadow-lg'
      new maplibregl.Marker({ element: el })
        .setLngLat([camp.location.lng, camp.location.lat])
        .addTo(map)
    })
    return () => {
      map.remove()
      miniMapRef.current = null
    }
  }, [camp])

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex flex-col p-8 max-w-4xl mx-auto w-full gap-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  if (!camp) {
    return (
      <div className="absolute inset-0 flex flex-col p-8 max-w-4xl mx-auto w-full">
        <Card className="border-danger bg-danger/10 text-center py-8">
          <p className="text-sm font-black uppercase text-danger">
            Camp not found
          </p>
          <Button
            variant="ghost"
            className="mt-4"
            onClick={() => navigate({ to: '/logistics' })}
          >
            Back to Logistics
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
          onClick={() => navigate({ to: '/logistics' })}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">
            {camp.name}
          </h1>
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest">
            Camp Detail
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Location
            </h3>
            <Badge
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
          <div className="h-48 rounded-lg overflow-hidden border border-[var(--color-border)]">
            <div ref={miniContainerRef} className="w-full h-full" />
          </div>
          <p className="text-xs font-bold text-text-muted">
            {camp.location.lat.toFixed(5)}, {camp.location.lng.toFixed(5)}
          </p>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <h3 className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2 mb-3">
              <Package className="w-4 h-4" /> Stock Status
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--color-surface-muted)] rounded-lg p-3">
                <p className="text-[10px] font-black uppercase text-text-muted">
                  Camp Type
                </p>
                <p className="text-sm font-black uppercase">{camp.camp_type}</p>
              </div>
              <div className="bg-[var(--color-surface-muted)] rounded-lg p-3">
                <p className="text-[10px] font-black uppercase text-text-muted">
                  Status
                </p>
                <p className="text-sm font-black uppercase">
                  {camp.stock_status.replace('_', ' ')}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4" /> Recent Activity
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm font-bold text-text-muted">
                <Clock className="w-4 h-4" />
                <span>Stock updates tracked in Logistics table</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
