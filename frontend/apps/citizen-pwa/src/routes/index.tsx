import { createRoute } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { Footer } from '@resq/ui-kit'
import {
  LiveStatusBanner,
  GovTicker,
  NoticeBoard,
  DisasterCategories,
  MapPreviewCTA,
  EssentialServices,
} from '../modules/home'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomeComponent,
})

function HomeComponent() {
  return (
    <div className="flex flex-col gap-6 pb-6">
      <GovTicker />

      <LiveStatusBanner />

      <MapPreviewCTA />

      <EssentialServices />

      <NoticeBoard />

      <DisasterCategories />

      <Footer />
    </div>
  )
}
