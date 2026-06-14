import { createRouter } from '@tanstack/react-router'
import { Route as rootRoute } from './routes/__root'
import { Route as indexRoute } from './routes/index'
import { Route as loginRoute } from './routes/auth.login'
import { Route as commandCenterRoute } from './routes/command-center'
import { Route as triageRoute } from './routes/triage'
import { Route as logisticsRoute } from './routes/logistics'
import { Route as logisticsNewRoute } from './routes/logistics.new'
import { Route as logisticsIdRoute } from './routes/logistics.$id'
import { Route as triageIdRoute } from './routes/triage.$id'
import { Route as broadcastRoute } from './routes/broadcast'
import { Route as sosRoute } from './routes/sos'
import { Route as hazardsNewRoute } from './routes/hazards.new'
import { Route as hazardsIdRoute } from './routes/hazards.$id'

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  commandCenterRoute,
  sosRoute,
  triageRoute,
  triageIdRoute,
  logisticsRoute,
  logisticsNewRoute,
  logisticsIdRoute,
  hazardsNewRoute,
  hazardsIdRoute,
  broadcastRoute,
])

export const router = createRouter({
  routeTree,
  context: { queryClient: undefined! },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

