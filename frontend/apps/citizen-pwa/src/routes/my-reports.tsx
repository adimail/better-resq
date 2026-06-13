import { createRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Route as rootRoute } from './__root'
import { Card, Badge, Skeleton, Button } from '@resq/ui-kit'
import { incidentService } from '@resq/api-client'
import {
  ChevronLeft,
  AlertCircle,
  Clock,
  MapPin,
  CheckCircle2,
} from 'lucide-react'
import { AppLink } from '../components/AppLink'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/my-reports',
  component: MyReportsPage,
})

function MyReportsPage() {
  const navigate = useNavigate()
  const isAuthenticated = Boolean(localStorage.getItem('access_token'))

  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-incidents'],
    queryFn: () => incidentService.myHistory(),
    enabled: isAuthenticated,
  })

  const reports = data?.data ?? []

  if (!isAuthenticated) {
    return (
      <main className="p-4 flex flex-col gap-4">
        <header className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 p-2"
            onClick={() => navigate({ to: '/' })}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-black uppercase tracking-tight">
            My Reports
          </h1>
        </header>
        <Card className="border-warning bg-warning/10 text-warning text-sm font-black uppercase">
          Sign in to view your submission history.
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
          className="-ml-2 p-2 text-text-main"
          onClick={() => navigate({ to: '/profile' })}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">
            My Reports
          </h1>
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1">
            Incident Submission History
          </p>
        </div>
      </header>

      {isLoading && <Skeleton className="h-64 w-full" />}
      {isError && (
        <Card className="border-danger bg-danger/10 text-danger text-sm font-black uppercase flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> Failed to load your reports.
        </Card>
      )}

      {!isLoading && !isError && reports.length === 0 && (
        <Card className="text-center py-10 text-text-muted uppercase font-black text-sm">
          You haven't submitted any reports yet.
        </Card>
      )}

      <div className="flex flex-col gap-4">
        {reports.map((report) => (
          <AppLink
            key={report.id}
            to={`/my-reports/${report.id}`}
            className="block no-underline"
          >
            <Card className="flex flex-col gap-3 shadow-sm border-[var(--color-border)]">
              <div className="flex justify-between items-start">
                <Badge
                  variant={
                    report.status === 'VERIFIED'
                      ? 'success'
                      : report.status === 'REJECTED'
                        ? 'danger'
                        : 'warning'
                  }
                >
                  {report.status}
                </Badge>
                <div className="text-[10px] font-black uppercase text-text-muted flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(report.created_at).toLocaleString()}
                </div>
              </div>

              <div className="flex items-start gap-4">
                {report.image_url && (
                  <img
                    src={report.image_url}
                    className="w-16 h-16 object-cover rounded bg-black/5"
                    alt=""
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-black uppercase text-sm">
                    {report.disaster_type} Report
                  </h3>
                  <p className="text-xs font-bold text-text-muted mt-1 line-clamp-2">
                    {report.description}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between">
                <span className="text-[10px] font-black text-text-muted uppercase flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {report.location.lat.toFixed(4)},{' '}
                  {report.location.lng.toFixed(4)}
                </span>
                {report.status === 'VERIFIED' && (
                  <span className="text-[10px] font-black text-success uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Active Hazard
                  </span>
                )}
              </div>
            </Card>
          </AppLink>
        ))}
      </div>
    </main>
  )
}
