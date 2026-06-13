import { api } from '../client'
import type { AuthResponse, TokenResponse, User } from '@resq/types'

export const authService = {
  login: async (credentials: any): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/login', credentials)
    return data
  },
  register: async (payload: {
    phone_number: string
    password: string
    full_name: string
    email?: string
  }): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/register', payload)
    return data
  },
  refresh: async (refreshToken: string): Promise<TokenResponse> => {
    const { data } = await api.post('/auth/refresh', {
      refresh_token: refreshToken,
    })
    return data
  },
  logout: async (refreshToken: string) => {
    await api.post('/auth/logout', { refresh_token: refreshToken })
  },
  me: async (): Promise<User> => {
    const { data } = await api.get('/users/me')
    return data
  },
  updateDevice: async (payload: {
    fcm_token?: string
    location: { lat: number; lng: number }
  }) => {
    await api.patch('/users/me/device', payload)
  },
  listUsers: async (): Promise<User[]> => {
    const { data } = await api.get('/users')
    return data
  },
}
