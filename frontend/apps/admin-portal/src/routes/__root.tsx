import {
  createRootRouteWithContext,
  Outlet,
  useRouterState,
  useNavigate,
} from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryClient as ReactQueryClient } from '@tanstack/react-query'
import { Toaster, toast } from 'sonner'
import { ErrorScreen, LoadingScreen, Button } from '@resq/ui-kit'
import { authService, ResQStream } from '@resq/api-client'
import {
  Users,
  LogOut,
  ShieldAlert,
  Monitor,
  CheckSquare,
  Package,
  Radio,
  Search,
  Activity,
  SignalHigh,
  MapPin,
} from 'lucide-react'
import { useEffect } from 'react'

export const Route = createRootRouteWithContext<{ queryClient: ReactQueryClient }>()(
  {
    component: RootComponent,
    pendingComponent: LoadingScreen,
    errorComponent: ({ reset }) => <ErrorScreen onRetry={reset} />,
  },
)

function RootComponent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isAuthPage = pathname.startsWith('/auth')
  const isAuthenticated = Boolean(localStorage.getItem('access_token'))

  const { data: user } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authService.me,
    enabled: isAuthenticated && !isAuthPage,
    retry: false,
  })

  useEffect(() => {
    if (!isAuthenticated || isAuthPage) return

    const stream = new ResQStream(18.5204, 73.8567, 500000)

    stream.connect(
      (payload) => {
        switch (payload.event) {
          case 'SOS_CREATED':
          case 'SOS_UPDATED':
            queryClient.invalidateQueries({ queryKey: ['admin-sos'] })
            if (payload.event === 'SOS_CREATED') {
              toast.error('New SOS Signal Received!')
            }
            break
          case 'INCIDENT_VERIFIED':
          case 'DANGER_ZONE_ACTIVE':
            queryClient.invalidateQueries({ queryKey: ['admin-danger-zones'] })
            queryClient.invalidateQueries({ queryKey: ['admin-incidents'] })
            break
          case 'CAMP_CREATED':
          case 'CAMP_STOCK_UPDATED':
            queryClient.invalidateQueries({ queryKey: ['admin-camps'] })
            break
        }
      },
      () => {}
    )

    return () => stream.disconnect()
  }, [isAuthenticated, isAuthPage, queryClient])

  if (!isAuthenticated && !isAuthPage) {
    navigate({ to: '/auth/login' })
    return null
  }

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)]">
        <Outlet />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[var(--bg-base)] overflow-hidden font-sans text-text-main">
      <aside className="w-64 min-w-fit bg-surface border-r border-[var(--color-border)] flex flex-col z-20">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-[var(--color-border)] shrink-0">
          <ShieldAlert className="w-6 h-6 text-primary" />
          <span className="font-black uppercase tracking-widest text-text-main text-lg">
            ResQ Admin
          </span>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
          <Button
            variant={pathname === '/command-center' ? 'primary' : 'ghost'}
            className="justify-start"
            onClick={() => navigate({ to: '/command-center' })}
          >
            <Monitor className="w-5 h-5 mr-3" /> Command Center
          </Button>
          <Button
            variant={pathname === '/sos' ? 'primary' : 'ghost'}
            className="justify-start"
            onClick={() => navigate({ to: '/sos' })}
          >
            <SignalHigh className="w-5 h-5 mr-3" /> SOS Signals
          </Button>
          <Button
            variant={pathname === '/triage' ? 'primary' : 'ghost'}
            className="justify-start"
            onClick={() => navigate({ to: '/triage' })}
          >
            <CheckSquare className="w-5 h-5 mr-3" /> Triage
          </Button>
          <Button
            variant={pathname === '/logistics' ? 'primary' : 'ghost'}
            className="justify-start"
            onClick={() => navigate({ to: '/logistics' })}
          >
            <Package className="w-5 h-5 mr-3" /> Logistics
          </Button>
          {user?.role === 'AUTHORITY' && (
            <>
              <Button
                variant={pathname === '/hazards/new' ? 'primary' : 'ghost'}
                className="justify-start"
                onClick={() => navigate({ to: '/hazards/new' })}
              >
                <MapPin className="w-5 h-5 mr-3" /> New Hazard Map
              </Button>
              <Button
                variant={pathname === '/broadcast' ? 'primary' : 'ghost'}
                className="justify-start"
                onClick={() => navigate({ to: '/broadcast' })}
              >
                <Radio className="w-5 h-5 mr-3" /> Broadcast
              </Button>
            </>
          )}
          <Button
            variant={pathname === '/' ? 'primary' : 'ghost'}
            className="justify-start"
            onClick={() => navigate({ to: '/' })}
          >
            <Users className="w-5 h-5 mr-3" /> Users Directory
          </Button>
        </nav>
        <div className="p-4 border-t border-[var(--color-border)] shrink-0 flex flex-col gap-4">
          <div className="flex flex-col gap-1 px-2">
            <span className="text-xs font-black uppercase text-text-main truncate">
              {user?.full_name || 'Loading'}
            </span>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
              {user?.role || '...'}
            </span>
          </div>
          <Button
            variant="danger"
            className="w-full justify-start"
            onClick={() => {
              localStorage.removeItem('access_token')
              localStorage.removeItem('refresh_token')
              navigate({ to: '/auth/login' })
            }}
          >
            <LogOut className="w-5 h-5 mr-3" /> Sign Out
          </Button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 bg-[var(--bg-base)]">
        <header className="h-16 border-b border-[var(--color-border)] bg-surface px-6 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-success" />
              <span className="text-xs font-black uppercase tracking-widest text-text-main">
                All Systems Operational
              </span>
            </div>
            <div className="flex items-center gap-2 text-text-muted">
              <Users className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">
                42 Active Personnel
              </span>
            </div>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="GLOBAL SEARCH"
              className="h-10 pl-10 pr-4 rounded bg-[var(--color-surface-muted)] border border-transparent focus:border-primary text-xs font-bold uppercase tracking-widest text-text-main outline-none w-64"
            />
          </div>
        </header>
        <div className="flex-1 relative flex flex-col overflow-hidden">
          <Outlet />
        </div>
      </main>

      <Toaster position="top-right" expand={false} richColors />
    </div>
  )
}