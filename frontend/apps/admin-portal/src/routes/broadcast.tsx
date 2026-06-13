import { createRoute, redirect } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { useEffect, useState } from 'react'
import { Card, Button, Modal, Input } from '@resq/ui-kit'
import { useForm } from '@tanstack/react-form'
import { api } from '@resq/api-client'
import { AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useMap } from '../hooks/useMap'
import type maplibregl from 'maplibre-gl'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/broadcast',
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
  component: BroadcastPage,
})

function BroadcastPage() {
  const { mapContainer, mapRef, isLoaded } = useMap()
  const [points, setPoints] = useState<number[][]>([])
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmText, setConfirmText] = useState('')

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
            'fill-opacity': 0.2,
          },
        })

        map.addLayer({
          id: 'draw-polygon-stroke',
          type: 'line',
          source: 'draw-polygon',
          paint: {
            'line-color': '#b91c1c',
            'line-width': 2,
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
                    type: 'Polygon',
                    coordinates: [coords],
                  },
                },
              ]
            : [],
      })
    }

    updateData()
  }, [points, isLoaded])

  const form = useForm({
    defaultValues: { message: '', severity: 3 },
    onSubmit: async () => {
      if (points.length < 3) return
      setShowConfirm(true)
    },
  })

  const handleConfirmExecute = async () => {
    if (confirmText !== 'CONFIRM') return
    
    const promise = api.post('/broadcasts', {
      message: form.state.values.message,
      severity: Number(form.state.values.severity),
      target_polygon: [[...points, points[0]]],
    })

    toast.promise(promise, {
      loading: 'Transmitting emergency broadcast...',
      success: `Emergency Broadcast Sent — targeting ${(points.length * 1250).toLocaleString()} devices`,
      error: 'Failed to send emergency broadcast',
    })

    try {
      await promise
      setPoints([])
      form.reset()
      setShowConfirm(false)
      setConfirmText('')
    } catch {}
  }

  return (
    <div className="absolute inset-0 flex h-full w-full">
      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirm Mass Broadcast"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm font-bold text-text-main">
            Are you sure? This will trigger emergency alarms on approximately{' '}
            <strong className="text-danger">
              {(points.length * 1250).toLocaleString()} devices
            </strong>{' '}
            in the selected area.
          </p>
          <Input
            label="Type CONFIRM to proceed"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
          <div className="flex gap-2 mt-2">
            <Button
              variant="danger"
              className="flex-1"
              disabled={confirmText !== 'CONFIRM'}
              onClick={handleConfirmExecute}
            >
              Send Alert
            </Button>
            <Button variant="ghost" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <div className="w-[65%] relative h-full bg-[var(--color-map-land)] flex flex-col">
        <div ref={mapContainer} className="flex-1" />
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
          <Card className="px-4 py-3 shadow-lg bg-surface/90 backdrop-blur pointer-events-auto">
            <h3 className="text-xs font-black uppercase text-text-main">
              Target Area Definition
            </h3>
            <p className="text-[10px] font-bold text-text-muted mt-1 uppercase">
              Click on the map to draw boundaries
            </p>
            {points.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-danger border border-danger/20 hover:bg-danger/10 w-full"
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
          <h2 className="text-2xl font-black uppercase tracking-tight text-danger flex items-center gap-2">
            <AlertCircle className="w-6 h-6" /> Emergency Broadcast
          </h2>
          <p className="text-xs font-bold text-text-muted mt-2 uppercase tracking-widest leading-relaxed">
            Send push notifications to devices physically located within the
            drawn boundary area.
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
              name="severity"
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
                    <option value={1}>1 - Informational</option>
                    <option value={2}>2 - Minor Alert</option>
                    <option value={3}>3 - Warning</option>
                    <option value={4}>4 - High Danger</option>
                    <option value={5}>5 - EXTREME CRITICAL</option>
                  </select>
                </div>
              )}
            />
            <form.Field
              name="message"
              children={(field) => (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase text-text-muted">
                    Broadcast Message
                  </label>
                  <textarea
                    className="border border-[var(--color-border)] p-3 rounded font-bold text-sm min-h-[120px] bg-bg-base resize-none outline-none focus:border-primary"
                    placeholder="Enter evacuation instructions or hazard warning..."
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    required
                    maxLength={500}
                  />
                  <div className="text-[10px] text-right font-black text-text-muted">
                    {field.state.value.length} / 500
                  </div>
                </div>
              )}
            />
            <div className="mt-auto pt-4">
              <Button
                type="submit"
                variant="danger"
                size="xl"
                className="w-full text-lg shadow-lg"
                disabled={
                  points.length < 3 || !form.state.values.message.trim()
                }
              >
                SEND OVERRIDE ALERT
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}