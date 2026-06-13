export type Role = 'CITIZEN' | 'AUTHORITY' | 'RESPONDER'
export type DisasterType =
  | 'flood'
  | 'fire'
  | 'quake'
  | 'storm'
  | 'structure_collapse'
export type StockStatus = 'fully_stocked' | 'low' | 'empty' | 'critical'
export type SosStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED'
export type IncidentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED'

export interface Location {
  lat: number
  lng: number
}

export interface User {
  id: string
  full_name: string
  phone_number: string
  email?: string
  role: Role
  fcm_device_token?: string
  last_known_location?: Location
  created_at?: string
}

export interface SosSignal {
  id: string
  citizen_id: string
  location: Location
  battery_level: number
  message: string
  status: SosStatus
  responder_id?: string
  created_at: string
}

export interface IncidentReport {
  id: string
  author_id: string
  disaster_type: DisasterType
  description: string
  image_url?: string
  location: Location
  status: IncidentStatus
  ai_confidence_score: number
  created_at: string
}

export interface DangerZone {
  id: string
  disaster_type: DisasterType
  severity_level: number
  boundary_polygon: number[][][]
  is_active: boolean
  expires_at: string
}

export interface ResourceCamp {
  id: string
  name: string
  camp_type: 'medical' | 'shelter' | 'food'
  stock_status: StockStatus
  location: Location
}

export type NotificationSeverity = 'info' | 'warning' | 'danger' | 'success'

export interface AppNotification {
  id: string
  title: string
  message: string
  severity: NotificationSeverity
  created_at: string
  read_at?: string | null
  location?: Location
}

export interface WeatherReport {
  location: Location
  temperature_c: number
  condition: string
  wind_kph?: number
  humidity_percent?: number
  rainfall_mm?: number
  updated_at: string
  alerts?: AppNotification[]
}
