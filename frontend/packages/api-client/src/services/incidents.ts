import { api } from '../client'

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
  verify: async (id: string, status: 'verified' | 'rejected') => {
    await api.patch(`/incidents/${id}/status`, { status })
  },
}
