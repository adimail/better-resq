import { createRoute, Link, useNavigate } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { useEffect, useRef, useState } from 'react'
import { Card, Button } from '@resq/ui-kit'
import { useForm } from '@tanstack/react-form'
import { api } from '@resq/api-client'
import { MapPin, PackagePlus } from 'lucide-react'
import { toast } from 'sonner'
import { useMap } from '../hooks/useMap'
import { useQueryClient } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import maplibregl from 'maplibre-gl'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/logistics/new',
  component: NewCampPage,
})

function NewCampPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { mapContainer, mapRef, isLoaded } = useMap([73.8567, 18.5204], 12)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm({
    defaultValues: {
      name: '',
      camp_type: 'medical' as any,
      lat: 18.5204,
      lng: 73.8567,
    },
    onSubmit: async ({ value }) => {
      if (!value.name.trim()) {
        toast.error('Camp name is required')
        return
      }

      if (Number.isNaN(value.lat) || Number.isNaN(value.lng)) {
        toast.error('Please provide valid coordinates')
        return
      }

      setIsSubmitting(true)

      const promise = api.post('/camps', {
        name: value.name,
        camp_type: value.camp_type,
        location: { lat: Number(value.lat), lng: Number(value.lng) },
      })

      toast.promise(promise, {
        loading: 'Deploying resource camp...',
        success: () => `${value.name} deployed successfully`,
        error: (err: any) =>
          err?.response?.data?.message ??
          err?.message ??
          'Failed to deploy camp',
      })

      try {
        await promise
        await queryClient.invalidateQueries({ queryKey: ['admin-camps'] })
        navigate({ to: '/logistics' as any })
      } finally {
        setIsSubmitting(false)
      }
    }
  })

  const nameValue = useStore(form.baseStore, (s) => s.values.name)


  useEffect(() => {
    if (!isLoaded || !mapRef.current) return

    markerRef.current = new maplibregl.Marker({ color: '#1976d2' })
      .setLngLat([form.state.values.lng, form.state.values.lat])
      .addTo(mapRef.current)

    const onClick = (e: maplibregl.MapMouseEvent) => {
      form.setFieldValue('lat', e.lngLat.lat)
      form.setFieldValue('lng', e.lngLat.lng)
      markerRef.current?.setLngLat([e.lngLat.lng, e.lngLat.lat])

      toast.success('Camp location updated')
    }

    mapRef.current.on('click', onClick)

    return () => {
      mapRef.current?.off('click', onClick)
      markerRef.current?.remove()
      markerRef.current = null
    }
  }, [isLoaded])

  return (
    <div className="absolute inset-0 flex h-full w-full">
      <div className="w-[65%] relative h-full bg-[var(--color-map-land)] flex flex-col">
        <div ref={mapContainer} className="flex-1" />
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
          <Card className="px-4 py-3 shadow-lg bg-surface/90 backdrop-blur pointer-events-auto">
            <h3 className="text-xs font-black uppercase text-primary flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Camp Location
            </h3>
            <p className="text-[10px] font-bold text-text-main mt-1 uppercase tracking-widest">
              Click anywhere on the map to set coordinates
            </p>
          </Card>
        </div>
      </div>
      <div className="w-[35%] bg-surface border-l border-[var(--color-border)] flex flex-col h-full overflow-y-auto">
        <div className="p-6 border-b border-[var(--color-border)]">
          <h2 className="text-2xl font-black uppercase tracking-tight text-text-main flex items-center gap-2">
            <PackagePlus className="w-6 h-6 text-primary" /> Deploy Camp
          </h2>
          <p className="text-xs font-bold text-text-muted mt-2 uppercase tracking-widest leading-relaxed">
            Register a new resource camp, shelter, or medical facility. This
            will immediately become visible to citizens on the map.
          </p>
        </div>
        <div className="p-6 flex-1 flex flex-col">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              void form.handleSubmit()
            }}
            className="flex flex-col gap-6 h-full"
          >
            <form.Field
              name="name"
              children={(field) => (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase text-text-muted">
                    Camp Name
                  </label>
                  <input
                    className="border border-[var(--color-border)] bg-bg-base p-3 rounded font-bold outline-none focus:border-primary"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    required
                    placeholder="e.g. Central City Relief Center"
                  />
                </div>
              )}
            />
            <form.Field
              name="camp_type"
              children={(field) => (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase text-text-muted">
                    Camp Type
                  </label>
                  <select
                    className="border border-[var(--color-border)] bg-bg-base p-3 rounded font-black uppercase outline-none focus:border-primary"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value as any)}
                  >
                    <option value="medical">Medical / First Aid</option>
                    <option value="shelter">Evacuation Shelter</option>
                    <option value="food">Food & Water Distribution</option>
                  </select>
                </div>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <form.Field
                name="lat"
                children={(field) => (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black uppercase text-text-muted">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      className="border border-[var(--color-border)] bg-bg-base p-3 rounded font-bold outline-none focus:border-primary font-mono text-sm"
                      value={field.state.value}
                      onChange={(e) =>
                        field.handleChange(Number(e.target.value))
                      }
                      required
                    />
                  </div>
                )}
              />
              <form.Field
                name="lng"
                children={(field) => (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black uppercase text-text-muted">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      className="border border-[var(--color-border)] bg-bg-base p-3 rounded font-bold outline-none focus:border-primary font-mono text-sm"
                      value={field.state.value}
                      onChange={(e) =>
                        field.handleChange(Number(e.target.value))
                      }
                      required
                    />
                  </div>
                )}
              />
            </div>
            <div className="mt-auto pt-4 flex flex-col gap-3">
              <Button
                type="submit"
                size="xl"
                className="w-full text-lg shadow-lg"
                disabled={!nameValue.trim() || isSubmitting}
                isLoading={isSubmitting}
              >
                Confirm Deployment
              </Button>
              <Link
                to="/logistics"
                onClick={(e: any) => {
                  if (isSubmitting) {
                    e.preventDefault()
                    toast.warning('Deployment is currently in progress')
                  }
                }}
                className="flex min-h-[48px] items-center justify-center rounded-md px-4 py-2 font-black uppercase tracking-widest text-text-main hover:bg-black/5 no-underline"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}