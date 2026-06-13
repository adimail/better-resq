import { createRoute } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { Card, Badge, Skeleton } from '@resq/ui-kit'
import { Building2, AlertCircle, Boxes, ChevronRight } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { useMapResources } from '../hooks/useSync'
import { AppLink } from '../components/AppLink'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/camps',
  component: CampsPage,
})

function CampsPage() {
  const location = useAppStore((state) => state.currentLocation)
  const { camps } = useMapResources(location)

  return (
    <main className="p-4 flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-black uppercase tracking-tight text-text-main">
          Resource Camps
        </h1>
        <p className="mt-1 text-xs font-bold text-text-muted uppercase tracking-widest">
          Shelters, medical points, and food
        </p>
      </section>

      {!location && (
        <Card className="border-warning bg-warning/10 p-3">
          <p className="text-xs font-black uppercase text-warning flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Enable location to find nearby camps.
          </p>
        </Card>
      )}

      {camps.isLoading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {camps.isError && (
        <Card className="border-danger bg-danger/5 text-center py-6">
          <AlertCircle className="w-8 h-8 mx-auto text-danger mb-2" />
          <p className="text-xs font-black uppercase text-danger">
            Failed to load camps
          </p>
        </Card>
      )}

      {camps.data?.length === 0 && (
        <Card className="flex items-center gap-3 p-4">
          <Boxes className="h-6 w-6 text-text-muted shrink-0" />
          <p className="text-sm font-black uppercase text-text-main">
            No resource camps deployed nearby.
          </p>
        </Card>
      )}

      <div className="flex flex-col gap-3 pb-6">
        {camps.data?.map((camp) => (
          <AppLink
            key={camp.id}
            to={`/camps/${camp.id}`}
            className="block no-underline pressable"
          >
            <Card className="flex flex-row items-center gap-4 p-4 border-[var(--color-border)] shadow-sm hover:border-primary/30">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                  camp.stock_status === 'critical'
                    ? 'bg-danger/10 text-danger'
                    : 'bg-primary/10 text-primary'
                }`}
              >
                <Building2 className="w-6 h-6" />
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                <h3 className="font-black uppercase truncate text-sm text-text-main">
                  {camp.name}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    {camp.camp_type}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-text-muted/30" />
                  <Badge
                    variant={
                      camp.stock_status === 'fully_stocked'
                        ? 'success'
                        : camp.stock_status === 'low'
                          ? 'warning'
                          : 'danger'
                    }
                  >
                    {camp.stock_status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-text-muted/40 shrink-0" />
            </Card>
          </AppLink>
        ))}
      </div>
    </main>
  )
}