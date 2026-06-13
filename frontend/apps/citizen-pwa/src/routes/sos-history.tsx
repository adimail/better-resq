import { createRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Route as rootRoute } from './__root'
import { Card, Badge, Skeleton, Button } from '@resq/ui-kit'
import { sosService } from '@resq/api-client'
import { Radio, Clock, CheckCircle2, UserCheck, ChevronLeft, AlertCircle, MapPin } from 'lucide-react'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sos-history',
  component: SosHistoryPage,
})

const STATUS_PIPELINE = ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'] as const

const statusConfig: Record<string, { label: string; variant: 'danger' | 'warning' | 'success'; icon: any }> = {
  ACTIVE: { label: 'Sent', variant: 'danger', icon: Radio },
  ACKNOWLEDGED: { label: 'Acknowledged', variant: 'warning', icon: UserCheck },
  RESOLVED: { label: 'Resolved', variant: 'success', icon: CheckCircle2 },
}

function StatusPipeline({ currentStatus }: { currentStatus: string }) {
  const currentIdx = STATUS_PIPELINE.indexOf(currentStatus as any)
  return (
    <div className="flex items-center gap-1">
      {STATUS_PIPELINE.map((status, idx) => {
        const config = statusConfig[status]
        const isReached = idx <= currentIdx
        const isCurrent = idx === currentIdx
        return (
          <div key={status} className="flex items-center gap-1 flex-1">
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                isReached
                  ? isCurrent
                    ? 'bg-danger/10 text-danger'
                    : 'bg-success/10 text-success'
                  : 'bg-black/5 text-text-muted'
              }`}
            >
              {isReached ? <config.icon className="w-3 h-3" /> : <div className="w-3 h-3" />}
              <span>{config.label}</span>
            </div>
            {idx < STATUS_PIPELINE.length - 1 && (
              <div
                className={`h-px flex-1 ${
                  idx < currentIdx ? 'bg-success' : 'bg-black/10'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function SosHistoryPage() {
  const navigate = useNavigate()
  const isAuthenticated = Boolean(localStorage.getItem('access_token'))

  const { data, isLoading, isError } = useQuery({
    queryKey: ['sos-history'],
    queryFn: () => sosService.history(),
    enabled: isAuthenticated,
  })

  const signals = data?.data ?? []
  
  const ongoingSignals = signals.filter(s => {
    const status = s.status?.toUpperCase()
    return status === 'ACTIVE' || status === 'ACKNOWLEDGED'
  })
  
  const pastSignals = signals.filter(s => s.status?.toUpperCase() === 'RESOLVED')

  if (!isAuthenticated) {
    return (
      <main className="p-4 flex flex-col gap-4">
        <header className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 p-2 text-text-main hover:bg-black/5"
            onClick={() => navigate({ to: '/' })}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-black uppercase tracking-tight">SOS History</h1>
        </header>
        <Card className="border-warning bg-warning/10">
          <p className="text-sm font-black uppercase text-warning">
            Sign in to view your SOS history.
          </p>
        </Card>
      </main>
    )
  }

  return (
    <main className="p-4 flex flex-col gap-6 pb-6">
      <header className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 p-2 text-text-main hover:bg-black/5"
          onClick={() => navigate({ to: '/profile' })}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">SOS History</h1>
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1">
            Emergency Signal Timeline
          </p>
        </div>
      </header>

      {isLoading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {isError && (
        <Card className="border-danger bg-danger/10">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
            <p className="text-sm font-black uppercase text-danger">
              Failed to load SOS history.
            </p>
          </div>
        </Card>
      )}

      {!isLoading && !isError && signals.length === 0 && (
        <Card className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-success" />
          <p className="text-sm font-black uppercase text-text-main">
            No SOS signals sent. Stay safe.
          </p>
        </Card>
      )}

      {ongoingSignals.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-black uppercase text-text-muted tracking-widest pl-1">
            Active Emergencies
          </h2>
          {ongoingSignals.map((signal) => {
            const status = signal.status?.toUpperCase()
            const config = statusConfig[status] || statusConfig.ACTIVE
            const StatusIcon = config.icon
            return (
              <Card key={signal.id} className="flex flex-col gap-4 border-danger/30 shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-3 rounded-lg ${
                        status === 'ACTIVE'
                          ? 'bg-danger/10 animate-pulse'
                          : 'bg-warning/10'
                      }`}
                    >
                      <StatusIcon
                        className={`w-6 h-6 ${
                          status === 'ACTIVE' ? 'text-danger' : 'text-warning'
                        }`}
                      />
                    </div>
                    <div>
                      <Badge variant={config.variant}>{config.label}</Badge>
                      <p className="text-xs font-bold text-text-muted mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(signal.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <StatusPipeline currentStatus={status} />

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[var(--color-surface-muted)] rounded-lg p-3">
                    <p className="text-[10px] font-black uppercase text-text-muted">
                      Location
                    </p>
                    <p className="text-sm font-black">
                      {signal.location.lat.toFixed(4)}, {signal.location.lng.toFixed(4)}
                    </p>
                  </div>
                  <div className="bg-[var(--color-surface-muted)] rounded-lg p-3">
                    <p className="text-[10px] font-black uppercase text-text-muted">
                      Battery
                    </p>
                    <p className="text-sm font-black">
                      {signal.battery_level !== undefined ? `${signal.battery_level}%` : 'Unknown'}
                    </p>
                  </div>
                </div>

                {signal.message && (
                  <div className="bg-[var(--color-surface-muted)] rounded-lg p-3">
                    <p className="text-[10px] font-black uppercase text-text-muted mb-1">
                      Message
                    </p>
                    <p className="text-sm font-bold">{signal.message}</p>
                  </div>
                )}

                {signal.responder_id && (
                  <div className="flex items-center gap-2 text-xs font-bold text-warning bg-warning/10 p-2 rounded">
                    <UserCheck className="w-4 h-4" />
                    Responder assigned to your case
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {pastSignals.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-black uppercase text-text-muted tracking-widest pl-1 mt-2">
            Past History
          </h2>
          <Card className="p-0 overflow-hidden shadow-sm">
            {pastSignals.map((signal) => (
              <div
                key={signal.id}
                className="flex items-center justify-between p-3 border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-muted)]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-success/10 rounded-full shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-black uppercase text-text-main truncate">
                      Resolved
                    </span>
                    <span className="text-[10px] font-bold text-text-muted truncate">
                      {new Date(signal.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 pl-3">
                  <span className="text-[10px] font-black text-text-muted uppercase flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {signal.location.lat.toFixed(3)}, {signal.location.lng.toFixed(3)}
                  </span>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}
    </main>
  )
}