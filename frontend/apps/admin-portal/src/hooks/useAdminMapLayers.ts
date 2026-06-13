import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import {
  useAdminDangerZones,
  useAdminCamps,
  useAdminSOS,
} from './useAdminData'

interface MapLayerFilters {
  hazards: boolean
  camps: boolean
  sos: boolean
}

export function useAdminMapLayers(
  mapRef: React.RefObject<maplibregl.Map | null>,
  isLoaded: boolean,
  filters: MapLayerFilters,
) {
  const markersRef = useRef<maplibregl.Marker[]>([])
  const popupRef = useRef<maplibregl.Popup | null>(null)
  const { data: dangerZones } = useAdminDangerZones()
  const { data: camps } = useAdminCamps()
  const { data: sosSignals } = useAdminSOS()

  useEffect(() => {
    const map = mapRef.current
    if (!map || !isLoaded) return

    const clickHandler = (e: any) => {
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

      map.flyTo({ center: e.lngLat, zoom: 15, duration: 1500 })
    }

    const mouseEnter = () => { map.getCanvas().style.cursor = 'pointer' }
    const mouseLeave = () => { map.getCanvas().style.cursor = '' }

    map.on('click', 'admin-zones-fill', clickHandler)
    map.on('mouseenter', 'admin-zones-fill', mouseEnter)
    map.on('mouseleave', 'admin-zones-fill', mouseLeave)

    return () => {
      map.off('click', 'admin-zones-fill', clickHandler)
      map.off('mouseenter', 'admin-zones-fill', mouseEnter)
      map.off('mouseleave', 'admin-zones-fill', mouseLeave)
    }
  }, [isLoaded, mapRef])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !isLoaded) return

    const activeZones =
      filters.hazards && dangerZones
        ? dangerZones.filter((z) => z.is_active)
        : []

    const geojsonData: any = {
      type: 'FeatureCollection',
      features: activeZones.map((zone) => ({
        type: 'Feature',
        properties: { severity: zone.severity_level, disaster_type: zone.disaster_type },
        geometry: {
          type: 'Polygon',
          coordinates: zone.boundary_polygon,
        },
      })),
    }

    if (!map.getSource('admin-zones')) {
      map.addSource('admin-zones', {
        type: 'geojson',
        data: geojsonData,
      })

      map.addLayer({
        id: 'admin-zones-fill',
        type: 'fill',
        source: 'admin-zones',
        paint: {
          'fill-color': '#b91c1c',
          'fill-opacity': 0.3,
        },
      })

      map.addLayer({
        id: 'admin-zones-border',
        type: 'line',
        source: 'admin-zones',
        paint: {
          'line-color': '#7f1d1d',
          'line-width': 2,
        },
      })
    } else {
      const source = map.getSource('admin-zones') as maplibregl.GeoJSONSource
      source.setData(geojsonData)
    }
  }, [dangerZones, filters.hazards, isLoaded, mapRef])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !isLoaded) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    if (filters.camps && camps) {
      camps.forEach((camp: any) => {
        if (!camp.location?.lng || !camp.location?.lat) return
        
        const el = document.createElement('div')
        el.className =
          'w-6 h-6 bg-success rounded-lg border-2 border-white flex items-center justify-center text-white text-[10px] font-black cursor-pointer shadow-md'
        el.textContent = camp.camp_type?.[0]?.toUpperCase() ?? 'C'
        
        const marker = new maplibregl.Marker({ element: el })
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

        el.addEventListener('click', () => {
          map.flyTo({ center: [camp.location.lng, camp.location.lat], zoom: 15, duration: 1500 })
        })

        markersRef.current.push(marker)
      })
    }

    if (filters.sos && sosSignals?.data) {
      sosSignals.data.forEach((sos: any) => {
        if (!sos.location?.lng || !sos.location?.lat) return

        const el = document.createElement('div')
        el.className =
          'w-5 h-5 bg-danger rounded-full border-2 border-white shadow-[0_0_0_4px_rgba(185,28,28,0.3)] animate-pulse cursor-pointer'
        
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([sos.location.lng, sos.location.lat])
          .setPopup(
            new maplibregl.Popup({ offset: 15 }).setHTML(`
              <div style="font-family: inherit; padding: 4px; min-width: 140px;">
                <div style="font-weight: 900; text-transform: uppercase; font-size: 14px; color: #b91c1c; margin-bottom: 4px;">SOS Signal</div>
                <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #666;">Status: ${sos.status}</div>
                <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #666;">Battery: ${sos.battery_level}%</div>
                <div style="font-size: 12px; font-weight: 600; margin-top: 4px; border-top: 1px solid #eee; padding-top: 4px;">${sos.message || 'No message'}</div>
              </div>
            `)
          )
          .addTo(map)

        el.addEventListener('click', () => {
          map.flyTo({ center: [sos.location.lng, sos.location.lat], zoom: 15, duration: 1500 })
        })

        markersRef.current.push(marker)
      })
    }
  }, [camps, sosSignals, filters.camps, filters.sos, isLoaded, mapRef])

  return { markersRef, dangerZones, camps, sosSignals }
}