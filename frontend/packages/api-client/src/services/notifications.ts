import { api } from '../client'
import type { AppNotification, PaginatedResponse } from '@resq/types'

export const notificationService = {
  list: async (params?: {
    cursor?: string
    limit?: number
  }): Promise<PaginatedResponse<AppNotification>> => {
    const { data } = await api.get('/notifications', { params })
    return data
  },
  markRead: async (id: string) => {
    await api.patch(`/notifications/${id}/read`)
  },
}
