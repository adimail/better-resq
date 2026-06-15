import { createRoute } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { useParams } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { mapService } from '@resq/api-client'
import { Card, Button, Modal, Input } from '@resq/ui-kit'
import {
  ArrowLeft,
  AlertTriangle,
  MapPin,
  Map,
  Edit2,
  Trash2,
} from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useMap } from '../hooks/useMap'
import maplibregl from 'maplibre-gl'
import { toast } from 'sonner'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/hazards/$id',
  component: HazardDetail,
})

function HazardDetail() {
  const { id } = useParams({ from: '/hazards/$id' })
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: hazard, isLoading } = useQuery({
    queryKey: ['danger-zone', id],
    queryFn: () => mapService.getDangerZoneById(id),
  })

  const { mapContainer, mapRef, isLoaded } = useMap([73.8567, 18.5204], 14)

  const [isEditing, setIsEditing] = useState(false)
  const [editPoints, setEditPoints] = useState<number[][]>([])
  const [editType, setEditType] = useState('flood')
  const [editSeverity, setEditSeverity] = useState(3)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const editMarkersRef = useRef<maplibregl.Marker[]>([])

  useEffect(() => {
    if (hazard && !isEditing) {
      setEditPoints(hazard.boundary_polygon[0].slice(0, -1))
      setEditType(hazard.disaster_type)
      setEditSeverity(hazard.severity_level)
    }
  }, [hazard, isEditing])

  useEffect(() => {
    if (!mapRef.current || !isLoaded || !hazard) return

    const map = mapRef.current
    const lng = hazard.boundary_polygon?.[0]?.[0]?.[0] || 73.8567
    const lat = hazard.boundary_polygon?.[0]?.[0]?.[1] || 18.5204

    if (!isEditing) {
      map.setCenter([lng, lat])
    }

    if (!map.getSource('hazard-polygon')) {
      map.addSource('hazard-polygon', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: hazard.boundary_polygon,
          },
        },
      })

      map.addLayer({
        id: 'hazard-polygon-fill',
        type: 'fill',
        source: 'hazard-polygon',
        paint: {
          'fill-color': '#b91c1c',
          'fill-opacity': 0.3,
        },
      })

      map.addLayer({
        id: 'hazard-polygon-line',
        type: 'line',
        source: 'hazard-polygon',
        paint: {
          'line-color': '#7f1d1d',
          'line-width': 2,
        },
      })
    }
  }, [isLoaded, hazard, mapRef, isEditing])

  useEffect(() => {
    if (!mapRef.current || !isLoaded) return
    const map = mapRef.current

    if (isEditing) {
      editMarkersRef.current.forEach((m) => m.remove())
      editMarkersRef.current = []

      editPoints.forEach((pt, i) => {
        const el = document.createElement('div')
        el.className =
          'w-4 h-4 bg-white border-2 border-danger rounded-full cursor-grab shadow-sm'
        const marker = new maplibregl.Marker({ element: el, draggable: true })
          .setLngLat([pt[0], pt[1]])
          .addTo(map)

        marker.on('drag', () => {
          const lngLat = marker.getLngLat()
          setEditPoints((prev) => {
            const next = [...prev]
            next[i] = [lngLat.lng, lngLat.lat]
            return next
          })
        })
        editMarkersRef.current.push(marker)
      })
    } else {
      editMarkersRef.current.forEach((m) => m.remove())
      editMarkersRef.current = []
    }
  }, [isEditing, isLoaded, editPoints.length])

  useEffect(() => {
    if (!mapRef.current || !isLoaded) return
    const source = mapRef.current.getSource(
      'hazard-polygon',
    ) as maplibregl.GeoJSONSource
    if (source && editPoints.length >= 3) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [[...editPoints, editPoints[0]]],
        },
      })
    }
  }, [editPoints, isLoaded])

  const handleSaveEdit = async () => {
    try {
      await mapService.updateDangerZone(id, {
        disaster_type: editType,
        severity_level: editSeverity,
        boundary_polygon: [[...editPoints, editPoints[0]]],
      })
      toast.success('Danger zone updated successfully')
      setIsEditing(false)
      queryClient.invalidateQueries({ queryKey: ['danger-zone', id] })
    } catch (err) {
      toast.error('Failed to update danger zone')
    }
  }

  const handleDelete = async () => {
    if (deleteConfirmText !== 'CONFIRM') return
    try {
      await mapService.deleteDangerZone(id)
      toast.success('Danger zone deleted')
      setShowDeleteModal(false)
      navigate({ to: '/command-center' })
    } catch (err) {
      toast.error('Failed to delete danger zone')
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center uppercase font-black text-text-muted">
        Loading hazard details...
      </div>
    )
  }

  if (!hazard) {
    return (
      <div className="p-8 text-center uppercase font-black text-danger">
        Hazard not found
      </div>
    )
  }

  const lat = editPoints[0]?.[1] || 0
  const lng = editPoints[0]?.[0] || 0

  return (
    <div className="max-w-4xl mx-auto p-6 w-full">
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Deletion"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm font-bold text-text-main">
            Are you sure you want to deactivate and remove this danger zone?
          </p>
          <Input
            label="Type CONFIRM to proceed"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
          />
          <div className="flex gap-2 mt-2">
            <Button
              variant="danger"
              className="flex-1"
              disabled={deleteConfirmText !== 'CONFIRM'}
              onClick={handleDelete}
            >
              Delete Zone
            </Button>
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <button
        onClick={() => navigate({ to: '/command-center' })}
        className="flex items-center gap-2 text-sm font-bold mb-6 hover:text-primary transition-colors uppercase tracking-widest text-text-muted"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Command Center
      </button>

      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-danger" />
            <h1 className="text-3xl font-black tracking-tight uppercase">
              Danger Zone Alert
            </h1>
          </div>
          {isEditing ? (
            <div className="flex gap-4 mt-2">
              <select
                className="border border-[var(--color-border)] p-2 rounded font-black uppercase outline-none"
                value={editType}
                onChange={(e) => setEditType(e.target.value)}
              >
                <option value="flood">Flood</option>
                <option value="fire">Fire</option>
                <option value="quake">Quake</option>
                <option value="storm">Storm</option>
                <option value="structure_collapse">Collapse</option>
              </select>
              <select
                className="border border-[var(--color-border)] p-2 rounded font-black uppercase outline-none"
                value={editSeverity}
                onChange={(e) => setEditSeverity(Number(e.target.value))}
              >
                <option value={1}>Severity 1</option>
                <option value={2}>Severity 2</option>
                <option value={3}>Severity 3</option>
                <option value={4}>Severity 4</option>
                <option value={5}>Severity 5</option>
              </select>
            </div>
          ) : (
            <p className="text-xl text-text-main mt-1 uppercase font-bold tracking-widest">
              {hazard.disaster_type?.replace('_', ' ')}
            </p>
          )}
        </div>
        <div
          className={`px-4 py-2 rounded-full font-black text-sm uppercase tracking-widest ${hazard.severity_level >= 4 ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}
        >
          Severity {isEditing ? editSeverity : hazard.severity_level}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-0 overflow-hidden flex flex-col">
            <div className="p-6 pb-4 flex justify-between items-center">
              <h2 className="font-black uppercase tracking-widest text-xs text-text-muted">
                Hazard Boundary Map
              </h2>
              {isEditing && (
                <span className="text-[10px] font-bold text-danger uppercase tracking-widest animate-pulse">
                  Drag points to reshape
                </span>
              )}
            </div>
            <div className="h-80 w-full border-y border-[var(--color-border)] bg-[var(--color-map-land)] relative">
              <div
                ref={mapContainer}
                className="absolute inset-0 h-full w-full"
              />
            </div>
            <div className="p-6 pt-4">
              <div className="flex items-center gap-3 text-text-main">
                <MapPin className="w-5 h-5 text-danger" />
                <div>
                  <div className="font-mono text-sm font-bold">
                    {lat.toFixed(5)}, {lng.toFixed(5)}
                  </div>
                  <div className="text-xs font-bold text-text-muted mt-1 uppercase tracking-widest">
                    Polygon Boundary Origin
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-black uppercase tracking-widest text-xs mb-4 text-text-muted">
              Status Timeline
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-success mt-2" />
                <div className="flex-1">
                  <div className="font-black uppercase tracking-widest text-sm">
                    Zone Established
                  </div>
                  <div className="text-xs font-bold text-text-muted uppercase">
                    {new Date(hazard.created_at || Date.now()).toLocaleString(
                      'en-IN',
                    )}
                  </div>
                </div>
              </div>
              {hazard.expires_at && (
                <div className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-warning mt-2" />
                  <div className="flex-1">
                    <div className="font-black uppercase tracking-widest text-sm">
                      Scheduled Expiration
                    </div>
                    <div className="text-xs font-bold text-text-muted uppercase">
                      {new Date(hazard.expires_at).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-black uppercase tracking-widest text-xs mb-4 text-text-muted">
              Zone State
            </h2>
            <div className="flex items-center gap-2 text-2xl font-black text-danger uppercase tracking-tight">
              <Map className="w-6 h-6" />{' '}
              {hazard.is_active ? 'Active' : 'Inactive'}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-black uppercase tracking-widest text-xs mb-4 text-text-muted">
              Management
            </h2>
            <div className="space-y-3">
              {isEditing ? (
                <>
                  <Button className="w-full" onClick={handleSaveEdit}>
                    Save Changes
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="w-4 h-4 mr-2" /> Edit Zone
                  </Button>
                  <Button
                    variant="danger"
                    className="w-full"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Deactivate & Delete
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
