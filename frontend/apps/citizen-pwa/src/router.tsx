import { createRouter, useNavigate } from '@tanstack/react-router'
import { Route as rootRoute } from './routes/__root'
import { Route as indexRoute } from './routes/index'
import { Route as campsRoute } from './routes/camps'
import { Route as mapRoute } from './routes/map'
import { Route as reportRoute } from './routes/report'
import { Route as notificationsRoute } from './routes/notifications'
import { Route as helplinesRoute } from './routes/helplines'
import { Route as survivalGuidesRoute } from './routes/survival-guides'
import { Route as weatherRoute } from './routes/weather'
import { Route as loginRoute } from './routes/auth.login'
import { Route as registerRoute } from './routes/auth.register'
import { Route as profileRoute } from './routes/profile'
import { Route as sosHistoryRoute } from './routes/sos-history'
import { Route as campsIdRoute } from './routes/camps.$id'
import { Route as myReportsRoute } from './routes/my-reports'
import { Route as myReportsIdRoute } from './routes/my-reports.$id'
import { Route as hazardsIdRoute } from './routes/hazards.$id'
import { NotFound } from '@resq/ui-kit'

const routeTree = rootRoute.addChildren([
  indexRoute,
  campsRoute,
  campsIdRoute,
  mapRoute,
  reportRoute,
  notificationsRoute,
  helplinesRoute,
  survivalGuidesRoute,
  weatherRoute,
  loginRoute,
  registerRoute,
  profileRoute,
  sosHistoryRoute,
  myReportsRoute,
  myReportsIdRoute,
  hazardsIdRoute,
])

export const router = createRouter({
  routeTree,
  context: { queryClient: undefined! },
  defaultNotFoundComponent: NotFoundRoute,
})

function NotFoundRoute() {
  const navigate = useNavigate()
  return <NotFound onAction={() => navigate({ to: '/' })} />
}

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
