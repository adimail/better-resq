import { createRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Route as rootRoute } from './__root'
import { ResQStream } from '@resq/api-client'
import { Card } from '@resq/ui-kit'
import {
  Clock,
  Activity,
  AlertTriangle,
  Radio,
  Package,
  FileText,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { useMap } from '../hooks/useMap'
import { useAdminMapLayers } from '../hooks/useAdminMapLayers'
import { useQuery } from '@tanstack/react-query'
import { api } from '@resq/api-client'
import {
  useAdminCamps,
  useAdminSOS,
  useAdminIncidents,
} from '../hooks/useAdminData'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/command-center',
  component: CommandCenter,
})

const formatEventTime = (ts: any) => {
  if (!ts) return 'Unknown'
  let d = new Date(ts)
  if (
    isNaN(d.getTime()) &&
    typeof ts === 'string' &&
    ts.includes('-') &&
    !ts.includes('T')
  ) {
    const ms = parseInt(ts.split('-')[0], 10)
    if (!isNaN(ms)) d = new Date(ms)
  }
  if (isNaN(d.getTime())) return 'Invalid Date'
  const parts = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('day')} ${get('month')} ${get('year')}, ${get('hour')}:${get('minute')}:${get('second')}`
}

function CommandCenter() {
  const { mapContainer, mapRef, isLoaded } = useMap()
  const [events, setEvents] = useState<any[]>([])
  const [isListening, setIsListening] = useState(false)
  const [focusedEvent, setFocusedEvent] = useState<{
    id: string
    type: string
    coords: [number, number]
    title: string
    _t?: number
  } | null>(null)

  const [filters, setFilters] = useState({
    hazards: true,
    camps: true,
    sos: true,
    resolvedSos: false,
  })

  const { data: history } = useQuery({
    queryKey: ['event-history'],
    queryFn: () => api.get('/events/history').then((res) => res.data),
  })
  const { data: camps } = useAdminCamps()
  const { data: sosSignals } = useAdminSOS()
  const { data: incidents } = useAdminIncidents()

  useEffect(() => {
    if (history) setEvents(history)
  }, [history])

  useAdminMapLayers(mapRef, isLoaded, filters, focusedEvent)

  useEffect(() => {
    setIsListening(true)
    const stream = new ResQStream(18.5204, 73.8567, 500000)
    stream.connect(
      (data) => {
        setEvents((prev) => {
          const newEvent = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            payload: data,
          }
          let updated = [newEvent, ...prev]

          if (data.event === 'SOS_CREATED' || data.event === 'SOS_UPDATED') {
            const sosId = data.id
            const latestIndex = updated.findIndex(
              (e) =>
                (e.payload.event === 'SOS_CREATED' ||
                  e.payload.event === 'SOS_UPDATED') &&
                e.payload.id === sosId,
            )
            if (latestIndex !== -1) {
              updated.splice(latestIndex, 1)
            }
            updated = [newEvent, ...updated]
          }
          return updated.slice(0, 50)
        })
      },
      () => setIsListening(false),
    )
    return () => stream.disconnect()
  }, [])

  const handleFeedClick = (ev: any) => {
    const p = ev.payload
    let coords: [number, number] | null = null
    const targetId = p.id || p.camp_id || p.incident_id || ev.id
    let title = p.event

    if (p.lng !== undefined && p.lat !== undefined) {
      coords = [Number(p.lng), Number(p.lat)]
    }

    if (!coords) {
      if (p.event === 'SOS_CREATED' || p.event === 'SOS_UPDATED') {
        title = 'SOS Signal'
        if (sosSignals?.data) {
          const sos = sosSignals.data.find((s: any) => s.id === targetId)
          if (sos && sos.location) coords = [sos.location.lng, sos.location.lat]
        }
      } else if (
        p.event === 'CAMP_CREATED' ||
        p.event === 'CAMP_STOCK_UPDATED'
      ) {
        title = p.event === 'CAMP_CREATED' ? 'New Camp' : 'Camp Update'
        if (camps) {
          const camp = camps.find((c: any) => c.id === targetId)
          if (camp && camp.location)
            coords = [camp.location.lng, camp.location.lat]
        }
      } else if (
        p.event === 'INCIDENT_CREATED' ||
        p.event === 'INCIDENT_VERIFIED'
      ) {
        title =
          p.event === 'INCIDENT_CREATED' ? 'New Report' : 'Verified Hazard'
        if (incidents) {
          const inc = incidents.find((i: any) => i.id === targetId)
          if (inc && inc.location) coords = [inc.location.lng, inc.location.lat]
        }
      }
    }

    if (coords && targetId) {
      setFocusedEvent({
        id: targetId,
        type: p.event,
        coords,
        title,
        _t: Date.now(),
      })
    }
  }

  const getEventIcon = (event: string) => {
    if (event.includes('SOS')) return <Radio className="w-4 h-4 text-danger" />
    if (event.includes('CAMP'))
      return <Package className="w-4 h-4 text-success" />
    if (event === 'INCIDENT_CREATED')
      return <FileText className="w-4 h-4 text-warning" />
    if (event.includes('INCIDENT') || event.includes('DANGER'))
      return <AlertTriangle className="w-4 h-4 text-warning" />
    return <Activity className="w-4 h-4 text-primary" />
  }

  const getEventFormatting = (p: any) => {
    if (p.event === 'SOS_CREATED')
      return {
        title: 'New SOS Signal',
        color: 'text-danger',
        bg: 'bg-danger/10',
        border: 'border-danger/30',
      }
    if (p.event === 'SOS_UPDATED')
      return {
        title: 'SOS Status Update',
        color: 'text-warning',
        bg: 'bg-warning/10',
        border: 'border-warning/30',
      }
    if (p.event === 'CAMP_CREATED')
      return {
        title: 'Camp Deployed',
        color: 'text-success',
        bg: 'bg-success/10',
        border: 'border-success/30',
      }
    if (p.event === 'CAMP_STOCK_UPDATED')
      return {
        title: 'Camp Inventory Changed',
        color: 'text-success',
        bg: 'bg-success/10',
        border: 'border-success/30',
      }
    if (p.event === 'INCIDENT_CREATED')
      return {
        title: 'New Civilian Report',
        color: 'text-warning',
        bg: 'bg-warning/10',
        border: 'border-warning/30',
      }
    if (p.event === 'INCIDENT_VERIFIED')
      return {
        title: 'Hazard Verified',
        color: 'text-danger',
        bg: 'bg-danger/10',
        border: 'border-danger/30',
      }
    if (p.event === 'DANGER_ZONE_ACTIVE')
      return {
        title: 'Danger Zone Active',
        color: 'text-danger',
        bg: 'bg-danger/10',
        border: 'border-danger/30',
      }
    return {
      title: p.event,
      color: 'text-primary',
      bg: 'bg-primary/10',
      border: 'border-primary/30',
    }
  }

  const shouldShowEvent = (payload: any) => {
    if (payload.event === 'SOS_CREATED' || payload.event === 'SOS_UPDATED') {
      if (!filters.sos) return false
      const isResolved =
        payload.status === 'resolved' || payload.status === 'closed'
      if (isResolved && !filters.resolvedSos) return false
      return true
    }
    if (
      payload.event === 'CAMP_CREATED' ||
      payload.event === 'CAMP_STOCK_UPDATED'
    ) {
      return filters.camps
    }
    if (
      payload.event === 'INCIDENT_CREATED' ||
      payload.event === 'INCIDENT_VERIFIED' ||
      payload.event === 'DANGER_ZONE_ACTIVE'
    ) {
      return filters.hazards
    }
    return true
  }

  const filteredEvents = events.filter((ev) => shouldShowEvent(ev.payload))

  return (
    <div className="absolute inset-0 flex h-full w-full">
      <div className="w-[65%] relative h-full bg-[var(--color-map-land)]">
        <div ref={mapContainer} className="flex-1 h-full" />
      </div>
      <div className="w-[35%] bg-surface border-l border-[var(--color-border)] flex flex-col h-full">
        <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-text-main">
              Live Event Feed
            </h2>
            {isListening && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 text-success">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-[9px] font-black uppercase">
                  Listening...
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilters((f) => ({ ...f, hazards: !f.hazards }))}
              className={`px-3 py-1 text-xs font-bold rounded flex items-center gap-1 ${filters.hazards ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}
            >
              {filters.hazards ? (
                <ToggleRight className="w-4 h-4" />
              ) : (
                <ToggleLeft className="w-4 h-4" />
              )}{' '}
              Hazards
            </button>
            <button
              onClick={() => setFilters((f) => ({ ...f, sos: !f.sos }))}
              className={`px-3 py-1 text-xs font-bold rounded flex items-center gap-1 ${filters.sos ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}
            >
              {filters.sos ? (
                <ToggleRight className="w-4 h-4" />
              ) : (
                <ToggleLeft className="w-4 h-4" />
              )}{' '}
              SOS
            </button>
            <button
              onClick={() => setFilters((f) => ({ ...f, camps: !f.camps }))}
              className={`px-3 py-1 text-xs font-bold rounded flex items-center gap-1 ${filters.camps ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
            >
              {filters.camps ? (
                <ToggleRight className="w-4 h-4" />
              ) : (
                <ToggleLeft className="w-4 h-4" />
              )}{' '}
              Camps
            </button>
            <button
              onClick={() =>
                setFilters((f) => ({ ...f, resolvedSos: !f.resolvedSos }))
              }
              className={`px-3 py-1 text-xs font-bold rounded flex items-center gap-1 ${filters.resolvedSos ? 'bg-gray-300 text-gray-700' : 'bg-gray-100 text-gray-600'}`}
            >
              {filters.resolvedSos ? (
                <ToggleRight className="w-4 h-4" />
              ) : (
                <ToggleLeft className="w-4 h-4" />
              )}{' '}
              Ghost SOS
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {filteredEvents.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-text-muted">
              <Activity className="w-8 h-8 mb-2 opacity-50" />
              <span className="text-xs font-black uppercase tracking-widest">
                No matching events
              </span>
            </div>
          )}
          {filteredEvents.map((ev) => {
            const format = getEventFormatting(ev.payload)
            return (
              <button
                key={ev.id}
                onClick={() => handleFeedClick(ev)}
                className="block w-full text-left appearance-none bg-transparent p-0 m-0 border-none outline-none focus:outline-none"
              >
                <Card
                  className={`p-3 cursor-pointer hover:border-primary transition-colors hover:shadow-md border ${format.border} ${format.bg}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      {getEventIcon(ev.payload.event)}
                      <span
                        className={`text-[10px] font-black uppercase ${format.color}`}
                      >
                        {format.title}
                      </span>
                    </div>
                    <div className="flex items-center text-[10px] font-bold text-text-muted uppercase">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatEventTime(ev.timestamp)}
                    </div>
                  </div>
                  <div className="text-[11px] font-bold text-text-main bg-surface p-2 rounded truncate border border-black/5">
                    {ev.payload.type
                      ? `Type: ${ev.payload.type}`
                      : ev.payload.name
                        ? `Name: ${ev.payload.name}`
                        : ev.payload.status
                          ? `Status: ${ev.payload.status}`
                          : ev.payload.message || 'System alert triggered'}
                  </div>
                </Card>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
