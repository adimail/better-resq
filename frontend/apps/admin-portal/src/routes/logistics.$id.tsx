import { createRoute, useNavigate, useParams } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, mapService } from '@resq/api-client'
import { Card, Badge, Skeleton, Button, Modal, Input } from '@resq/ui-kit'
import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import {
  ChevronLeft,
  MapPin,
  Package,
  Clock,
  Activity,
  Edit2,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/logistics/$id',
  component: CampDetailPage,
})

const style: maplibregl.StyleSpecification = {
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

function CampDetailPage() {
  const { id } = useParams({ from: Route.id })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const miniContainerRef = useRef<HTMLDivElement>(null)
  const miniMapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState('medical')
  const [editLocation, setEditLocation] = useState({ lat: 0, lng: 0 })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const { data: camp, isLoading } = useQuery({
    queryKey: ['admin-camp', id],
    queryFn: async () => {
      const res = await api.get(`/camps/${id}`)
      return res.data
    },
  })

  useEffect(() => {
    if (camp && !isEditing) {
      setEditName(camp.name)
      setEditType(camp.camp_type)
      setEditLocation(camp.location)
    }
  }, [camp, isEditing])

  useEffect(() => {
    if (!camp || !miniContainerRef.current) return
    if (miniMapRef.current) {
      miniMapRef.current.remove()
      miniMapRef.current = null
    }
    const map = new maplibregl.Map({
      container: miniContainerRef.current,
      style,
      center: [camp.location.lng, camp.location.lat],
      zoom: 14,
      interactive: isEditing,
      attributionControl: false,
    })
    miniMapRef.current = map

    const el = document.createElement('div')
    el.className =
      'w-6 h-6 bg-success rounded-lg border-2 border-white shadow-lg cursor-pointer'

    const marker = new maplibregl.Marker({ element: el, draggable: isEditing })
      .setLngLat([camp.location.lng, camp.location.lat])
      .addTo(map)

    marker.on('dragend', () => {
      const lngLat = marker.getLngLat()
      setEditLocation({ lat: lngLat.lat, lng: lngLat.lng })
    })

    markerRef.current = marker

    return () => {
      map.remove()
      miniMapRef.current = null
      markerRef.current = null
    }
  }, [camp, isEditing])

  const handleSaveEdit = async () => {
    try {
      await mapService.updateCamp(id, {
        name: editName,
        camp_type: editType,
        location: editLocation,
      })
      toast.success('Camp updated successfully')
      setIsEditing(false)
      queryClient.invalidateQueries({ queryKey: ['admin-camp', id] })
    } catch (err) {
      toast.error('Failed to update camp')
    }
  }

  const handleDelete = async () => {
    if (deleteConfirmText !== 'CONFIRM') return
    try {
      await mapService.deleteCamp(id)
      toast.success('Camp dismantled and deleted')
      setShowDeleteModal(false)
      navigate({ to: '/logistics' })
    } catch (err) {
      toast.error('Failed to delete camp')
    }
  }

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex flex-col p-8 max-w-4xl mx-auto w-full gap-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  if (!camp) {
    return (
      <div className="absolute inset-0 flex flex-col p-8 max-w-4xl mx-auto w-full">
        <Card className="border-danger bg-danger/10 text-center py-8">
          <p className="text-sm font-black uppercase text-danger">
            Camp not found
          </p>
          <Button
            variant="ghost"
            className="mt-4"
            onClick={() => navigate({ to: '/logistics' })}
          >
            Back to Logistics
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex flex-col p-8 overflow-y-auto max-w-4xl mx-auto w-full gap-6">
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Camp Deletion"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm font-bold text-text-main">
            Are you sure you want to completely remove this resource camp?
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
              Dismantle Camp
            </Button>
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            onClick={() => navigate({ to: '/logistics' })}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            {isEditing ? (
              <input
                className="text-2xl font-black uppercase tracking-tight bg-transparent border-b-2 border-primary outline-none"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            ) : (
              <h1 className="text-2xl font-black uppercase tracking-tight">
                {camp.name}
              </h1>
            )}
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1">
              Camp Detail
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button size="sm" onClick={handleSaveEdit}>
                Save Changes
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="w-4 h-4 mr-2" /> Edit Camp
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Location
            </h3>
            <Badge
              variant={
                camp.stock_status === 'fully_stocked'
                  ? 'success'
                  : camp.stock_status === 'low'
                    ? 'warning'
                    : 'danger'
              }
            >
              {camp.stock_status.replace('_', ' ')}
            </Badge>
          </div>
          <div className="h-48 rounded-lg overflow-hidden border border-[var(--color-border)] relative">
            <div ref={miniContainerRef} className="w-full h-full" />
            {isEditing && (
              <div className="absolute top-2 left-2 bg-surface/90 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">
                Drag marker to relocate
              </div>
            )}
          </div>
          <p className="text-xs font-bold text-text-muted">
            {isEditing
              ? editLocation.lat.toFixed(5)
              : camp.location.lat.toFixed(5)}
            ,{' '}
            {isEditing
              ? editLocation.lng.toFixed(5)
              : camp.location.lng.toFixed(5)}
          </p>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <h3 className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2 mb-3">
              <Package className="w-4 h-4" /> Stock Status
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--color-surface-muted)] rounded-lg p-3">
                <p className="text-[10px] font-black uppercase text-text-muted mb-1">
                  Camp Type
                </p>
                {isEditing ? (
                  <select
                    className="w-full bg-surface border border-[var(--color-border)] rounded text-xs font-black uppercase p-1 outline-none"
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                  >
                    <option value="medical">Medical</option>
                    <option value="shelter">Shelter</option>
                    <option value="food">Food</option>
                  </select>
                ) : (
                  <p className="text-sm font-black uppercase">
                    {camp.camp_type}
                  </p>
                )}
              </div>
              <div className="bg-[var(--color-surface-muted)] rounded-lg p-3">
                <p className="text-[10px] font-black uppercase text-text-muted mb-1">
                  Status
                </p>
                <p className="text-sm font-black uppercase">
                  {camp.stock_status.replace('_', ' ')}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4" /> Recent Activity
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm font-bold text-text-muted">
                <Clock className="w-4 h-4" />
                <span>Stock updates tracked in Logistics table</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
