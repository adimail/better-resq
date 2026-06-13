import { api } from '../client'
import type { IncidentReport, PaginatedResponse } from '@resq/types'

export const incidentService = {
  getUploadUrl: async (content_type: string, file_size: number) => {
    const { data } = await api.post('/uploads/presigned-url', {
      content_type,
      file_size,
    })
    return data
  },
  submit: async (payload: any) => {
    return api.post('/incidents', payload, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    })
  },
  myHistory: async (): Promise<PaginatedResponse<IncidentReport>> => {
    const { data } = await api.get('/incidents/me')
    return data
  },
  verify: async (id: string, status: 'verified' | 'rejected') => {
    await api.patch(`/incidents/${id}/status`, { status })
  },
}
