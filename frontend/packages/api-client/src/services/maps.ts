import { api } from '../client'
import type { DangerZone, ResourceCamp, RouteResult } from '@resq/types'

export const mapService = {
  getDangerZones: async (bbox: string): Promise<DangerZone[]> => {
    const { data } = await api.get('/danger-zones', { params: { bbox } })
    return data
  },
  getDangerZoneById: async (id: string): Promise<DangerZone> => {
    const { data } = await api.get(`/danger-zones/${id}`)
    return data
  },
  getCamps: async (bbox: string): Promise<ResourceCamp[]> => {
    const { data } = await api.get('/camps', { params: { bbox } })
    return data
  },
  getSafeRoute: async (origin: string, dest: string): Promise<RouteResult> => {
    const { data } = await api.get('/routes/safe', {
      params: { origin, destination: dest, fallback: true },
    })
    return data
  },
  createDangerZone: async (payload: {
    disaster_type: string
    severity_level: number
    boundary_polygon: number[][][]
  }) => {
    return api.post('/danger-zones', payload, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    })
  },
}

