import type { User } from './models'

export interface ApiError {
  type: string
  status: number
  title: string
  detail: string
  instance?: string
  errors?: Record<string, string>
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
}

export interface AuthResponse extends TokenResponse {
  user: User
}

export interface PaginatedResponse<T> {
  data: T[]
  next_cursor: string | null
}

export interface RouteResult {
  distance_meters: number
  estimated_minutes: number
  geometry: string
  route_compromised: boolean
  turn_by_turn: string[]
}
