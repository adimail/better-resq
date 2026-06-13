import { createRoute } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { Card, Skeleton } from '@resq/ui-kit'
import { AlertTriangle, CloudSun, Droplets, Wind } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { useWeather } from '../hooks/useWeather'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/weather',
  component: WeatherPage,
})

function WeatherPage() {
  const location = useAppStore((state) => state.currentLocation)
  const weather = useWeather(location)

  return (
    <main className="p-4 flex flex-col gap-4">
      <section>
        <h1 className="text-2xl font-black uppercase tracking-tight">
          Weather
        </h1>
        <p className="mt-1 text-sm font-bold text-text-muted">
          Local conditions from the ResQ weather service.
        </p>
      </section>

      {!location && (
        <Card className="border-warning bg-warning/10">
          <p className="text-sm font-black uppercase text-warning">
            Enable location to load local weather.
          </p>
        </Card>
      )}

      {weather.isLoading && (
        <div className="flex flex-col gap-3" aria-label="Loading weather">
          <Skeleton className="h-32" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
      )}

      {weather.isError && (
        <Card className="border-danger bg-danger/10">
          <p className="text-sm font-black uppercase text-danger">
            Weather data is unavailable.
          </p>
        </Card>
      )}

      {weather.data && (
        <>
          <Card className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-text-muted">
                Current
              </p>
              <h2 className="mt-1 text-4xl font-black tracking-tight">
                {Math.round(weather.data.temperature_c)} C
              </h2>
              <p className="text-sm font-bold uppercase text-text-muted">
                {weather.data.condition}
              </p>
            </div>
            <CloudSun className="h-14 w-14 text-primary" />
          </Card>

          <section className="grid grid-cols-2 gap-3">
            <Metric
              icon={Wind}
              label="Wind"
              value={
                weather.data.wind_kph !== undefined
                  ? `${weather.data.wind_kph} kph`
                  : 'Unavailable'
              }
            />
            <Metric
              icon={Droplets}
              label="Humidity"
              value={
                weather.data.humidity_percent !== undefined
                  ? `${weather.data.humidity_percent}%`
                  : 'Unavailable'
              }
            />
          </section>

          <section className="flex flex-col gap-3">
            {weather.data.alerts?.map((alert) => (
              <Card key={alert.id} className="border-danger bg-danger/10">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-danger" />
                  <div>
                    <h3 className="text-sm font-black uppercase text-danger">
                      {alert.title}
                    </h3>
                    <p className="text-sm font-semibold text-text-main">
                      {alert.message}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </section>
        </>
      )}
    </main>
  )
}

const Metric = ({ icon: Icon, label, value }: any) => (
  <Card className="p-3">
    <Icon className="mb-3 h-6 w-6 text-primary" />
    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
      {label}
    </p>
    <p className="mt-1 text-sm font-black text-text-main">{value}</p>
  </Card>
)
