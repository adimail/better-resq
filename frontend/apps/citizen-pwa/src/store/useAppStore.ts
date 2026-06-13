import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type AppNotification, type DangerZone, type Location } from '@resq/types'

interface AppState {
  isEmergency: boolean
  activeAlerts: DangerZone[]
  locationName: string
  currentLocation?: Location
  isManualLocation: boolean
  notifications: AppNotification[]
  lastSyncedAt?: string
  pendingReports: number
  activeSosId: string | null
  activeSosStatus: string | null
  setEmergency: (status: boolean) => void
  setAlerts: (alerts: DangerZone[]) => void
  setLocation: (location?: Location, name?: string, manual?: boolean) => void
  setNotifications: (notifications: AppNotification[]) => void
  pushNotification: (notification: AppNotification) => void
  setLastSyncedAt: (value?: string) => void
  setPendingReports: (count: number) => void
  incrementPendingReports: () => void
  setActiveSos: (id: string | null, status: string | null) => void
  clearActiveSos: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isEmergency: false,
      activeAlerts: [],
      locationName: 'Location unavailable',
      isManualLocation: false,
      notifications: [],
      pendingReports:
        typeof window === 'undefined'
          ? 0
          : JSON.parse(localStorage.getItem('resq_pending_reports') || '[]').length,
      activeSosId: null,
      activeSosStatus: null,
      setEmergency: (status) => set({ isEmergency: status }),
      setAlerts: (alerts) => set({ activeAlerts: alerts }),
      setLocation: (location, name, manual) =>
        set((state) => ({
          currentLocation: location,
          locationName: name ?? state.locationName,
          isManualLocation: manual ?? false,
        })),
      setNotifications: (notifications) =>
        set({ notifications, lastSyncedAt: new Date().toISOString() }),
      pushNotification: (notification) =>
        set((state) => ({
          notifications: [
            notification,
            ...state.notifications.filter((item) => item.id !== notification.id),
          ],
          lastSyncedAt: new Date().toISOString(),
        })),
      setLastSyncedAt: (value) => set({ lastSyncedAt: value }),
      setPendingReports: (count) => set({ pendingReports: count }),
      incrementPendingReports: () =>
        set((state) => ({ pendingReports: state.pendingReports + 1 })),
      setActiveSos: (id, status) => set({ activeSosId: id, activeSosStatus: status }),
      clearActiveSos: () => set({ activeSosId: null, activeSosStatus: null }),
    }),
    {
      name: 'resq-location-storage',
      partialize: (state) => ({
        currentLocation: state.currentLocation,
        locationName: state.locationName,
        isManualLocation: state.isManualLocation,
        activeSosId: state.activeSosId,
        activeSosStatus: state.activeSosStatus,
      }),
    }
  )
)