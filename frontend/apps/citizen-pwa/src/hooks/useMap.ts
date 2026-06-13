import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const mapStyle: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: 'OpenStreetMap',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
}

export interface UseMapOptions {
  center?: [number, number]
  zoom?: number
  minZoom?: number
  maxZoom?: number
  maxBounds?: maplibregl.LngLatBoundsLike
  interactive?: boolean
}

export function useMap(options: UseMapOptions = {}) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const optionsRef = useRef(options)

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: optionsRef.current.center || [73.8567, 18.5204],
      zoom: optionsRef.current.zoom || 11,
      minZoom: optionsRef.current.minZoom,
      maxZoom: optionsRef.current.maxZoom,
      maxBounds: optionsRef.current.maxBounds,
      interactive: optionsRef.current.interactive ?? true,
      attributionControl: false,
    })

    mapRef.current = map

    map.on('load', () => {
      setIsLoaded(true)
    })

    const ro = new ResizeObserver(() => {
      map.resize()
    })
    ro.observe(mapContainer.current)

    return () => {
      ro.disconnect()
      map.remove()
      mapRef.current = null
      setIsLoaded(false)
    }
  }, [])

  return { mapContainer, mapRef, isLoaded }
}