import { createRoute, useNavigate, useParams } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { useQuery } from '@tanstack/react-query'
import { api } from '@resq/api-client'
import { Card, Badge, Button } from '@resq/ui-kit'
import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  ChevronLeft,
  Clock,
  AlertTriangle,
  Image as ImageIcon,
  Info,
} from 'lucide-react'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/my-reports/$id',
  component: ReportDetailPage,
})

const style: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: 'OSM',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
}

function ReportDetailPage() {
  const { id } = useParams({ from: Route.id })
  const navigate = useNavigate()
  const mapContainer = useRef<HTMLDivElement>(null)

  const { data: report, isLoading } = useQuery({
    queryKey: ['report', id],
    queryFn: async () => {
      const { data } = await api.get(`/incidents/${id}`)
      return data
    },
  })

  useEffect(() => {
    if (!report || !mapContainer.current) return
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style,
      center: [report.location.lng, report.location.lat],
      zoom: 15,
      interactive: false,
    })
    map.on('load', () => {
      const el = document.createElement('div')
      el.className =
        'w-6 h-6 bg-primary rounded-full border-2 border-white shadow-lg'
      new maplibregl.Marker({ element: el })
        .setLngLat([report.location.lng, report.location.lat])
        .addTo(map)
    })
    return () => map.remove()
  }, [report])

  if (isLoading) return <main className="p-4">Loading...</main>
  if (!report) return <main className="p-4">Report not found.</main>

  return (
    <main className="p-4 flex flex-col gap-6 pb-10">
      <header className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 p-2"
          onClick={() => navigate({ to: '/my-reports' })}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-black uppercase tracking-tight">
          Report Details
        </h1>
      </header>

      <Card className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <Badge
            variant={
              report.status === 'VERIFIED'
                ? 'success'
                : report.status === 'REJECTED'
                  ? 'danger'
                  : 'warning'
            }
          >
            {report.status}
          </Badge>
          <span className="text-[10px] font-black text-text-muted uppercase flex items-center gap-1">
            <Clock className="w-3 h-3" />{' '}
            {new Date(report.created_at).toLocaleDateString()}
          </span>
        </div>

        <h2 className="text-2xl font-black uppercase flex items-center gap-2 text-primary">
          <AlertTriangle className="w-6 h-6" /> {report.disaster_type}
        </h2>

        <div className="h-64 w-full rounded-lg overflow-hidden border border-[var(--color-border)]">
          <div ref={mapContainer} className="h-full w-full" />
        </div>

        <div className="bg-[var(--color-surface-muted)] p-4 rounded-lg">
          <p className="text-[10px] font-black uppercase text-text-muted mb-1 flex items-center gap-1">
            <Info className="w-3 h-3" /> Description
          </p>
          <p className="text-sm font-bold">{report.description}</p>
        </div>

        {report.image_url && (
          <div>
            <p className="text-[10px] font-black uppercase text-text-muted mb-2 flex items-center gap-1">
              <ImageIcon className="w-3 h-3" /> Submitted Photo
            </p>
            <img
              src={report.image_url}
              className="w-full h-48 object-cover rounded-lg"
              alt="Incident"
            />
          </div>
        )}
      </Card>
    </main>
  )
}
