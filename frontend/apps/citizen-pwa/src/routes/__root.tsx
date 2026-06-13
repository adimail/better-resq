import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { Toaster, toast } from 'sonner'
import { ErrorScreen, LoadingScreen, OfflineBanner } from '@resq/ui-kit'
import { useEffect, useState } from 'react'
import { Header } from '../components/Header'
import { BottomNav } from '../components/BottomNav'
import { useLocation } from '../hooks/useLocation'
import { useSSE } from '../hooks/useSSE'
import { incidentService, sosService } from '@resq/api-client'
import { useAppStore } from '../store/useAppStore'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    component: () => {
      const [isOffline, setIsOffline] = useState(!navigator.onLine)
      const [isReconnecting, setIsReconnecting] = useState(false)
      const { location } = useLocation()
      const setPendingReports = useAppStore((state) => state.setPendingReports)
      const lastSyncedAt = useAppStore((state) => state.lastSyncedAt)
      const activeSosId = useAppStore((state) => state.activeSosId)
      const setActiveSos = useAppStore((state) => state.setActiveSos)
      const clearActiveSos = useAppStore((state) => state.clearActiveSos)

      const cachedAt = lastSyncedAt
        ? new Intl.DateTimeFormat(undefined, {
            hour: 'numeric',
            minute: '2-digit',
          }).format(new Date(lastSyncedAt))
        : undefined
      useSSE(location)

      useEffect(() => {
        if (activeSosId) {
          sosService.getById(activeSosId).then(res => {
            if (res.status === 'resolved' || res.status === 'RESOLVED') {
              clearActiveSos()
              toast.success('Your emergency has been resolved by responders.')
            } else {
              setActiveSos(res.id, res.status)
            }
          }).catch(() => {})
        }
      }, [activeSosId, clearActiveSos, setActiveSos])

      useEffect(() => {
        const handleOnline = async () => {
          setIsReconnecting(true)
          setIsOffline(false)
          const pending = JSON.parse(
            localStorage.getItem('resq_pending_reports') || '[]',
          )

          if (pending.length > 0) {
            const remaining = []
            for (const report of pending) {
              try {
                await incidentService.submit(report)
              } catch {
                remaining.push(report)
              }
            }
            localStorage.setItem('resq_pending_reports', JSON.stringify(remaining))
            setPendingReports(remaining.length)
          }

          window.setTimeout(() => setIsReconnecting(false), 600)
        }
        const handleOffline = () => setIsOffline(true)
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
          window.removeEventListener('online', handleOnline)
          window.removeEventListener('offline', handleOffline)
        }
      }, [setPendingReports])

      return (
        <div className="font-sans antialiased bg-[var(--bg-base)] min-h-screen flex flex-col">
          {isOffline && <OfflineBanner status="offline" cachedAt={cachedAt} />}
          {isReconnecting && <OfflineBanner status="reconnecting" />}

          <Header />

          <main className="flex-1 pb-32">
            <Outlet />
          </main>

          <BottomNav />

          <Toaster position="top-center" expand={false} richColors />
        </div>
      )
    },
    pendingComponent: LoadingScreen,
    errorComponent: ({ reset }) => (
      <ErrorScreen
        message={
          navigator.onLine
            ? 'The screen could not be loaded. Please retry.'
            : 'No internet connection. Cached screens remain available.'
        }
        onRetry={reset}
      />
    ),
  },
)