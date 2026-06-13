import { createRoute, redirect, useNavigate } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { useEffect, useState } from 'react'
import { Card, Button } from '@resq/ui-kit'
import { useForm } from '@tanstack/react-form'
import { mapService } from '@resq/api-client'
import { MapPin, ShieldAlert, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useMap } from '../hooks/useMap'
import type maplibregl from 'maplibre-gl'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/hazards/new',
  beforeLoad: () => {
    const token = localStorage.getItem('access_token')
    if (!token) throw redirect({ to: '/auth/login' })
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.role !== 'AUTHORITY')
        throw redirect({ to: '/command-center' })
    } catch {
      throw redirect({ to: '/auth/login' })
    }
  },
  component: NewHazardPage,
})

function NewHazardPage() {
  const navigate = useNavigate()
  const { mapContainer, mapRef, isLoaded } = useMap()
  const [points, setPoints] = useState<number[][]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const map = mapRef.current
    if (!map || !isLoaded) return

    const initDraw = () => {
      if (!map.isStyleLoaded()) {
        map.once('styledata', initDraw)
        return
      }

      if (!map.getSource('draw-polygon')) {
        map.addSource('draw-polygon', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        })

        map.addLayer({
          id: 'draw-polygon-fill',
          type: 'fill',
          source: 'draw-polygon',
          paint: {
            'fill-color': '#b91c1c',
            'fill-opacity': 0.3,
          },
        })

        map.addLayer({
          id: 'draw-polygon-stroke',
          type: 'line',
          source: 'draw-polygon',
          paint: {
            'line-color': '#7f1d1d',
            'line-width': 2,
            'line-dasharray': [2, 2],
          },
        })
      }
    }

    initDraw()

    const onClick = (e: maplibregl.MapMouseEvent) => {
      setPoints((prev) => [...prev, [e.lngLat.lng, e.lngLat.lat]])
    }

    map.on('click', onClick)

    return () => {
      map.off('click', onClick)
    }
  }, [isLoaded])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !isLoaded) return

    const updateData = () => {
      if (!map.isStyleLoaded()) {
        map.once('styledata', updateData)
        return
      }

      const source = map.getSource('draw-polygon') as maplibregl.GeoJSONSource
      if (!source) return

      let coords: number[][] = []
      if (points.length >= 3) {
        coords = [...points, points[0]]
      } else if (points.length > 0) {
        coords = points
      }

      source.setData({
        type: 'FeatureCollection',
        features:
          coords.length > 0
            ? [
                {
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: points.length >= 3 ? 'Polygon' : 'LineString',
                    coordinates: points.length >= 3 ? [coords] : coords,
                  },
                },
              ]
            : [],
      })
    }

    updateData()
  }, [points, isLoaded])

  const form = useForm({
    defaultValues: { disaster_type: 'flood', severity_level: 3 },
    onSubmit: async ({ value }) => {
      if (points.length < 3) return
      setIsSubmitting(true)

      const promise = mapService.createDangerZone({
        disaster_type: value.disaster_type,
        severity_level: Number(value.severity_level),
        boundary_polygon: [[...points, points[0]]],
      })

      toast.promise(promise, {
        loading: 'Establishing Danger Zone...',
        success: 'Danger Zone established successfully',
        error: 'Failed to create Danger Zone',
      })

      try {
        await promise
        navigate({ to: '/command-center' })
      } catch {
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  return (
    <div className="absolute inset-0 flex h-full w-full">
      <div className="w-[65%] relative h-full bg-[var(--color-map-land)] flex flex-col">
        <div ref={mapContainer} className="flex-1" />
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
          <Card className="px-4 py-3 shadow-lg bg-surface/90 backdrop-blur pointer-events-auto border-danger/30">
            <h3 className="text-xs font-black uppercase text-danger flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Zone Definition Tool
            </h3>
            <p className="text-[10px] font-bold text-text-main mt-1 uppercase tracking-widest">
              {points.length < 3
                ? `Click map to draw boundary (${points.length}/3 points min)`
                : 'Polygon complete. Ready for submission.'}
            </p>
            {points.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-3 text-text-muted border-text-muted/30 hover:bg-black/5 w-full"
                onClick={() => setPoints([])}
              >
                Clear Drawing
              </Button>
            )}
          </Card>
        </div>
      </div>
      <div className="w-[35%] bg-surface border-l border-[var(--color-border)] flex flex-col h-full overflow-y-auto">
        <div className="p-6 border-b border-[var(--color-border)]">
          <h2 className="text-2xl font-black uppercase tracking-tight text-text-main flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-danger" /> New Hazard Map
          </h2>
          <p className="text-xs font-bold text-text-muted mt-2 uppercase tracking-widest leading-relaxed">
            Draw a precise polygon on the map to establish a new Danger Zone.
            This will route citizens away from the area.
          </p>
        </div>
        <div className="p-6 flex-1 flex flex-col">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
            className="flex flex-col gap-6 h-full"
          >
            <form.Field
              name="disaster_type"
              children={(field) => (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase text-text-muted">
                    Disaster Type
                  </label>
                  <select
                    className="border border-[var(--color-border)] p-3 rounded font-black uppercase bg-bg-base outline-none focus:border-primary"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  >
                    <option value="flood">Flood</option>
                    <option value="fire">Fire</option>
                    <option value="quake">Earthquake</option>
                    <option value="storm">Severe Storm</option>
                    <option value="structure_collapse">
                      Structure Collapse
                    </option>
                  </select>
                </div>
              )}
            />
            <form.Field
              name="severity_level"
              children={(field) => (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase text-text-muted">
                    Severity Level
                  </label>
                  <select
                    className="border border-[var(--color-border)] p-3 rounded font-black uppercase bg-bg-base outline-none focus:border-primary"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                  >
                    <option value={1}>1 - Low Impact</option>
                    <option value={2}>2 - Moderate</option>
                    <option value={3}>3 - High Risk</option>
                    <option value={4}>4 - Severe Danger</option>
                    <option value={5}>5 - Catastrophic</option>
                  </select>
                </div>
              )}
            />
            <div className="mt-auto pt-4 flex flex-col gap-3">
              {points.length >= 3 ? (
                <Card className="bg-warning/10 border-warning/30 p-3">
                  <p className="text-xs font-bold text-warning uppercase flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    Establishing this zone will immediately affect navigation
                    routes for all active personnel and citizens in the area.
                  </p>
                </Card>
              ) : null}
              <Button
                type="submit"
                variant="danger"
                size="xl"
                className="w-full text-lg shadow-lg"
                disabled={points.length < 3 || isSubmitting}
                isLoading={isSubmitting}
              >
                Establish Danger Zone
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}