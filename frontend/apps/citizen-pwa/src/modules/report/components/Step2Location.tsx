import { useEffect } from 'react'
import { Badge, Button, Card } from '@resq/ui-kit'
import { LocateFixed, MapPin } from 'lucide-react'
import { useMap } from '../../../hooks/useMap'
import type { Location } from '@resq/types'

interface Step2LocationProps {
  reportLocation: Location | undefined
  setReportLocation: (loc: Location) => void
}

export const Step2Location = ({
  reportLocation,
  setReportLocation,
}: Step2LocationProps) => {
  const { mapContainer, mapRef, isLoaded } = useMap({
    center: reportLocation
      ? [reportLocation.lng, reportLocation.lat]
      : [73.8567, 18.5204],
    zoom: 15,
  })

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return
    const map = mapRef.current

    const onMove = () => {
      const center = map.getCenter()
      setReportLocation({ lat: center.lat, lng: center.lng })
    }

    map.on('move', onMove)

    return () => {
      map.off('move', onMove)
    }
  }, [isLoaded, setReportLocation])

  const jumpToCurrentLocation = () => {
    if (!navigator.geolocation || !mapRef.current) return

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setReportLocation(loc)
        mapRef.current?.flyTo({ center: [loc.lng, loc.lat], zoom: 16 })
      },
      () => {},
      { enableHighAccuracy: true },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-80 w-full rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-map-land)]">
        <div ref={mapContainer} className="h-full w-full" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-8">
          <MapPin className="h-10 w-10 text-danger drop-shadow-xl" />
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={jumpToCurrentLocation}
          className="absolute bottom-4 right-4 h-12 w-12 min-w-0 rounded-full p-0 shadow-lg bg-surface border-none"
        >
          <LocateFixed className="h-5 w-5 text-primary" />
        </Button>
      </div>
      <Card className="flex items-center justify-between bg-[var(--color-surface-muted)] py-3 px-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
            Incident Coordinates
          </p>
          <p className="text-sm font-bold font-mono text-text-main mt-0.5">
            {reportLocation
              ? `${reportLocation.lat.toFixed(5)}, ${reportLocation.lng.toFixed(5)}`
              : 'Unknown'}
          </p>
        </div>
        <Badge variant="neutral">Adjustable</Badge>
      </Card>
    </div>
  )
}
