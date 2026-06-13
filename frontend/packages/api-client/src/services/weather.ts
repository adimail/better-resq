import { api } from '../client'
import type { WeatherReport } from '@resq/types'

export const weatherService = {
  current: async (lat: number, lng: number): Promise<WeatherReport> => {
    const { data } = await api.get('/weather/current', {
      params: { lat, lng },
    })
    return data
  },
}
