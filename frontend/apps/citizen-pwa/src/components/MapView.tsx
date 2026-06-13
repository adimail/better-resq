import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import type { DangerZone, Location, ResourceCamp } from '@resq/types'
import { useMap } from '../hooks/useMap'

export const MapView = ({
  location,
  dangerZones,
  camps,
  bottomPadding = 0,
  focusedCoordinate,
}: {
  location?: Location
  dangerZones: DangerZone[]
  camps: ResourceCamp[]
  bottomPadding?: number
  focusedCoordinate?: Location
}) => {
  const { mapContainer, mapRef, isLoaded } = useMap({
    center: location ? [location.lng, location.lat] : [73.8567, 18.5204],
    zoom: location ? 14 : 11,
    minZoom: 9,
    maxZoom: 18,
    maxBounds: [
      [68.0, 6.0],
      [97.0, 35.0],
    ],
  })

  const markersRef = useRef<maplibregl.Marker[]>([])
  const popupRef = useRef<maplibregl.Popup | null>(null)

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return
    if (!mapRef.current.hasControl(maplibregl.AttributionControl.name as any)) {
      mapRef.current.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        'bottom-left',
      )
    }
  }, [isLoaded])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !isLoaded) return

    const clickHandler = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
      if (!e.features?.length) return
      const props = e.features[0].properties
      if (popupRef.current) popupRef.current.remove()
      
      popupRef.current = new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`
          <div style="font-family: inherit; padding: 4px; min-width: 140px;">
            <div style="font-weight: 900; text-transform: uppercase; font-size: 14px; color: #b91c1c; margin-bottom: 4px;">Severity ${props.severity} Hazard</div>
            <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #666;">Type: ${props.disaster_type?.replace('_', ' ') || 'Unknown'}</div>
          </div>
        `)
        .addTo(map)

      map.flyTo({
        center: e.lngLat,
        zoom: 15,
        duration: 1500,
      })
    }

    const mouseEnterHandler = () => { map.getCanvas().style.cursor = 'pointer' }
    const mouseLeaveHandler = () => { map.getCanvas().style.cursor = '' }

    map.on('click', 'danger-zones-fill', clickHandler)
    map.on('mouseenter', 'danger-zones-fill', mouseEnterHandler)
    map.on('mouseleave', 'danger-zones-fill', mouseLeaveHandler)

    return () => {
      map.off('click', 'danger-zones-fill', clickHandler)
      map.off('mouseenter', 'danger-zones-fill', mouseEnterHandler)
      map.off('mouseleave', 'danger-zones-fill', mouseLeaveHandler)
    }
  }, [isLoaded])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !isLoaded) return
    map.easeTo({ padding: { bottom: bottomPadding }, duration: 300 })
  }, [bottomPadding, isLoaded])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !location || !isLoaded) return
    map.easeTo({ center: [location.lng, location.lat], zoom: 13 })
  }, [location, isLoaded])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !isLoaded || !focusedCoordinate) return
    map.flyTo({
      center: [focusedCoordinate.lng, focusedCoordinate.lat],
      zoom: 15,
      duration: 1500,
    })
  }, [focusedCoordinate, isLoaded])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !isLoaded) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    if (location) {
      const element = document.createElement('div')
      element.className =
        'h-4 w-4 rounded-full border-2 border-white bg-primary shadow-lg cursor-pointer'
      
      const marker = new maplibregl.Marker({ element })
        .setLngLat([location.lng, location.lat])
        .setPopup(new maplibregl.Popup({ offset: 10 }).setHTML(`
          <div style="font-family: inherit; padding: 4px;">
            <div style="font-weight: 900; text-transform: uppercase; font-size: 12px;">Your Location</div>
          </div>
        `))
        .addTo(map)

      element.addEventListener('click', () => {
        map.flyTo({
          center: [location.lng, location.lat],
          zoom: 15,
          duration: 1500,
        })
      })

      markersRef.current.push(marker)
    }

    camps.forEach((camp) => {
      const element = document.createElement('div')
      element.className =
        'flex h-8 w-8 items-center justify-center rounded-lg border-2 border-white bg-success text-white shadow-lg cursor-pointer'
      element.textContent = camp.camp_type.charAt(0).toUpperCase()
      
      const marker = new maplibregl.Marker({ element })
        .setLngLat([camp.location.lng, camp.location.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 15 }).setHTML(`
            <div style="font-family: inherit; padding: 4px; min-width: 120px;">
              <div style="font-weight: 900; text-transform: uppercase; font-size: 14px; margin-bottom: 4px;">${camp.name}</div>
              <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #666;">Type: ${camp.camp_type}</div>
              <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #666;">Status: ${camp.stock_status.replace('_', ' ')}</div>
            </div>
          `)
        )
        .addTo(map)

      element.addEventListener('click', () => {
        map.flyTo({
          center: [camp.location.lng, camp.location.lat],
          zoom: 15,
          duration: 1500,
        })
      })

      markersRef.current.push(marker)
    })
  }, [camps, location, isLoaded])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !isLoaded) return

    if (map.getLayer('danger-zones-fill')) map.removeLayer('danger-zones-fill')
    if (map.getLayer('danger-zones-border')) map.removeLayer('danger-zones-border')
    if (map.getSource('danger-zones')) map.removeSource('danger-zones')

    map.addSource('danger-zones', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: dangerZones.map((zone) => ({
          type: 'Feature',
          properties: {
            id: zone.id,
            severity: zone.severity_level,
            disaster_type: zone.disaster_type,
          },
          geometry: {
            type: 'Polygon',
            coordinates: zone.boundary_polygon,
          },
        })),
      },
    })

    map.addLayer({
      id: 'danger-zones-fill',
      type: 'fill',
      source: 'danger-zones',
      paint: {
        'fill-color': '#b91c1c',
        'fill-opacity': 0.28,
      },
    })

    map.addLayer({
      id: 'danger-zones-border',
      type: 'line',
      source: 'danger-zones',
      paint: {
        'line-color': '#7f1d1d',
        'line-width': 2,
      },
    })
  }, [dangerZones, isLoaded])

  return (
    <div className="absolute inset-0 h-full w-full bg-[var(--color-map-land)]">
      <div ref={mapContainer} className="absolute inset-0 h-full w-full" />
    </div>
  )
}