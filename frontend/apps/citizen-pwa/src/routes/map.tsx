import { useState, useEffect } from 'react'
import { createRoute } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { Card } from '@resq/ui-kit'
import { AlertTriangle, Building2, MapPinned } from 'lucide-react'
import { MapView } from '../components/MapView'
import { useAppStore } from '../store/useAppStore'
import { useMapResources } from '../hooks/useSync'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/map',
  component: MapPage,
})

function MapPage() {
  const location = useAppStore((state) => state.currentLocation)
  const { dangerZones, camps } = useMapResources(location)
  const activeZones = dangerZones.data?.filter((zone) => zone.is_active) ?? []
  const [isExpanded, setIsExpanded] = useState(false)
  const [padding, setPadding] = useState(140)
  const [focusedCoordinate, setFocusedCoordinate] = useState<{ lat: number; lng: number } | undefined>()

  useEffect(() => {
    setPadding(isExpanded ? window.innerHeight * 0.5 : 140)
  }, [isExpanded])

  return (
    <div className="fixed inset-0 top-16 bottom-16 z-0 flex flex-col">
      <MapView
        location={location}
        dangerZones={activeZones}
        camps={camps.data ?? []}
        bottomPadding={padding}
        focusedCoordinate={focusedCoordinate}
      />

      <div className="absolute top-0 left-0 right-0 z-10 flex flex-col gap-2 p-4 pointer-events-none">
        <div className="inline-flex flex-col bg-surface/80 backdrop-blur-md px-4 py-2 rounded-lg border border-[var(--color-border)] w-max shadow-sm">
          <h1 className="text-xl font-black uppercase tracking-tight text-text-main">
            Evacuation Map
          </h1>
          <p className="text-xs font-bold text-text-muted">
            Live hazards and resource camps.
          </p>
        </div>

        {!location && (
          <Card className="border-warning bg-warning/90 backdrop-blur-md pointer-events-auto mt-1 shadow-sm">
            <p className="text-sm font-black uppercase text-text-inverted">
              Enable location to center the evacuation map.
            </p>
          </Card>
        )}

        {(dangerZones.isError || camps.isError) && (
          <Card className="border-danger bg-danger/90 backdrop-blur-md pointer-events-auto mt-1 shadow-sm">
            <p className="text-sm font-black uppercase text-white">
              Map resources could not be loaded.
            </p>
          </Card>
        )}
      </div>

      <div
        className={`absolute bottom-0 left-0 right-0 z-20 bg-surface rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] flex flex-col transition-[height] duration-300 ease-in-out ${
          isExpanded ? 'h-[50vh]' : 'h-[140px]'
        }`}
      >
        <div
          className="flex items-center justify-center pt-4 pb-3 cursor-pointer shrink-0"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="w-12 h-1.5 bg-black/20 dark:bg-white/20 rounded-full" />
        </div>

        <div className="px-4 pb-4 shrink-0 flex flex-col gap-3">
          <div
            className="grid grid-cols-2 gap-3 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Card className="flex items-center gap-3 p-3 shadow-none border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <AlertTriangle className="h-6 w-6 text-danger shrink-0" />
              <div>
                <p className="text-[10px] font-black uppercase text-text-muted">
                  Hazards
                </p>
                <p className="text-xl font-black leading-none">
                  {activeZones.length}
                </p>
              </div>
            </Card>

            <Card className="flex items-center gap-3 p-3 shadow-none border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <Building2 className="h-6 w-6 text-success shrink-0" />
              <div>
                <p className="text-[10px] font-black uppercase text-text-muted">
                  Camps
                </p>
                <p className="text-xl font-black leading-none">
                  {camps.data?.length ?? 0}
                </p>
              </div>
            </Card>
          </div>
        </div>

        <div
          className={`flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-3 transition-opacity duration-300 delay-100 ${
            isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {activeZones.length === 0 && !dangerZones.isLoading && (
            <Card className="flex items-center gap-3 border-success bg-success/10 shrink-0">
              <MapPinned className="h-6 w-6 text-success shrink-0" />
              <p className="text-sm font-black uppercase text-success">
                No verified hazards in the current map radius.
              </p>
            </Card>
          )}

          {activeZones.map((zone) => (
            <Card
              key={zone.id}
              className="border-danger/30 bg-danger/5 shrink-0 flex items-start gap-3 cursor-pointer pressable"
              onClick={() => {
                setFocusedCoordinate({
                  lat: zone.boundary_polygon[0][0][1],
                  lng: zone.boundary_polygon[0][0][0],
                })
                setIsExpanded(false)
              }}
            >
              <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase text-danger">
                  Severity {zone.severity_level} Hazard
                </span>
                <span className="text-sm font-bold text-text-main capitalize">
                  {zone.disaster_type.replace('_', ' ')} Warning
                </span>
              </div>
            </Card>
          ))}

          {camps.data?.map((camp) => (
            <Card
              key={camp.id}
              className="border-success/30 bg-success/5 shrink-0 flex items-start gap-3 cursor-pointer pressable"
              onClick={() => {
                setFocusedCoordinate(camp.location)
                setIsExpanded(false)
              }}
            >
              <Building2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase text-success">
                  {camp.camp_type} Camp
                </span>
                <span className="text-sm font-bold text-text-main">
                  {camp.name}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}