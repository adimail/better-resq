import { createRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Route as rootRoute } from './__root'
import { ResQStream } from '@resq/api-client'
import { Card, Badge, Button } from '@resq/ui-kit'
import { Clock } from 'lucide-react'
import { useMap } from '../hooks/useMap'
import { useAdminMapLayers } from '../hooks/useAdminMapLayers'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/command-center',
  component: CommandCenter,
})

function CommandCenter() {
  const { mapContainer, mapRef, isLoaded } = useMap()
  const [events, setEvents] = useState<any[]>([])

  const [filters, setFilters] = useState({
    hazards: true,
    camps: true,
    sos: true,
  })

  const { camps, sosSignals } = useAdminMapLayers(mapRef, isLoaded, filters)

  useEffect(() => {
    const stream = new ResQStream(18.5204, 73.8567, 500000)
    stream.connect(
      (data) => {
        setEvents((prev) =>
          [
            {
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              payload: data,
            },
            ...prev,
          ].slice(0, 50),
        )
      },
      () => {},
    )
    return () => stream.disconnect()
  }, [])

  const handleEventClick = (ev: any) => {
    const map = mapRef.current
    if (!map) return
    const id =
      ev.payload?.id || ev.payload?.data?.camp_id || ev.payload?.data?.sos_id
    if (!id) return

    let targetLat, targetLng

    if (ev.payload.event === 'SOS_CREATED' && sosSignals?.data) {
      const sos = sosSignals.data.find((s) => s.id === id)
      if (sos?.location) {
        targetLat = sos.location.lat
        targetLng = sos.location.lng
      }
    } else if (ev.payload.event === 'CAMP_STOCK_UPDATED' && camps) {
      const camp = camps.find((c) => c.id === id)
      if (camp?.location) {
        targetLat = camp.location.lat
        targetLng = camp.location.lng
      }
    }

    if (targetLat && targetLng) {
      map.flyTo({ center: [targetLng, targetLat], zoom: 15, duration: 1500 })
    }
  }

  return (
    <div className="absolute inset-0 flex h-full w-full">
      <div className="w-[65%] relative h-full bg-[var(--color-map-land)] flex flex-col">
        <div ref={mapContainer} className="flex-1" />
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setFilters((s) => ({ ...s, hazards: !s.hazards }))}
            className={`px-4 py-2 flex items-center gap-2 shadow-lg bg-surface/90 backdrop-blur transition-opacity ${!filters.hazards ? 'opacity-50' : ''}`}
          >
            <div className="w-3 h-3 rounded-full bg-danger" />
            <span className="text-xs font-black uppercase tracking-widest text-text-main">
              Hazards
            </span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setFilters((s) => ({ ...s, camps: !s.camps }))}
            className={`px-4 py-2 flex items-center gap-2 shadow-lg bg-surface/90 backdrop-blur transition-opacity ${!filters.camps ? 'opacity-50' : ''}`}
          >
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-xs font-black uppercase tracking-widest text-text-main">
              Camps
            </span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setFilters((s) => ({ ...s, sos: !s.sos }))}
            className={`px-4 py-2 flex items-center gap-2 shadow-lg bg-surface/90 backdrop-blur transition-opacity ${!filters.sos ? 'opacity-50' : ''}`}
          >
            <div className="w-3 h-3 rounded-full bg-danger animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-text-main">
              SOS
            </span>
          </Button>
        </div>
      </div>
      <div className="w-[35%] bg-surface border-l border-[var(--color-border)] flex flex-col h-full">
        <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] shrink-0">
          <h2 className="text-sm font-black uppercase tracking-widest text-text-main">
            Live Event Feed
          </h2>
          <p className="text-[10px] font-bold text-text-muted mt-1 uppercase">
            Real-time system stream
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {events.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-text-muted">
              <Activity className="w-8 h-8 mb-2 opacity-50" />
              <span className="text-xs font-black uppercase tracking-widest">
                Listening for events...
              </span>
            </div>
          )}
          {events.map((ev) => (
            <button
              key={ev.id}
              onClick={() => handleEventClick(ev)}
              className="block w-full text-left appearance-none bg-transparent p-0 m-0 border-none outline-none focus:outline-none"
            >
              <Card className="p-3 cursor-pointer hover:border-primary transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <Badge
                    variant={
                      ev.payload.event === 'SOS_CREATED' ? 'danger' : 'neutral'
                    }
                  >
                    {ev.payload.event || 'SYSTEM_EVENT'}
                  </Badge>
                  <div className="flex items-center text-[10px] font-bold text-text-muted uppercase">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <pre className="text-[10px] font-bold text-text-main bg-black/5 p-2 rounded overflow-x-auto">
                  {JSON.stringify(ev.payload.data || ev.payload, null, 2)}
                </pre>
              </Card>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Activity(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}