import { api } from '../client'
import type { SosSignal, PaginatedResponse } from '@resq/types'

export const sosService = {
  trigger: async (payload: Partial<SosSignal>): Promise<{ id: string }> => {
    const { data } = await api.post('/sos', payload, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    })
    return data
  },
  getById: async (id: string): Promise<{ id: string; status: string }> => {
    const { data } = await api.get(`/sos/${id}`)
    return data
  },
  list: async (params: any): Promise<PaginatedResponse<SosSignal>> => {
    const { data } = await api.get('/sos', { params })
    return data
  },
  history: async (): Promise<PaginatedResponse<SosSignal>> => {
    const { data } = await api.get('/sos/history')
    return data
  },
  updateStatus: async (id: string, status: string) => {
    await api.patch(`/sos/${id}/status`, { status })
  },
}