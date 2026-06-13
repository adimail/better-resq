import { useQuery } from '@tanstack/react-query'
import { weatherService } from '@resq/api-client'
import type { Location } from '@resq/types'

export const useWeather = (location?: Location) =>
  useQuery({
    queryKey: ['weather', location?.lat, location?.lng],
    queryFn: () => weatherService.current(location!.lat, location!.lng),
    enabled: Boolean(location),
    retry: false,
  })
