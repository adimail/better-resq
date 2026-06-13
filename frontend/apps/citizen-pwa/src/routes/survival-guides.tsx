import { createRoute } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { Card } from '@resq/ui-kit'
import { BookOpenCheck } from 'lucide-react'
import { survivalGuides } from '../content/emergency'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/survival-guides',
  component: SurvivalGuidesPage,
})

function SurvivalGuidesPage() {
  return (
    <main className="p-4 flex flex-col gap-4">
      <section>
        <h1 className="text-2xl font-black uppercase tracking-tight">
          Survival Guides
        </h1>
        <p className="mt-1 text-sm font-bold text-text-muted">
          Practical disaster actions for the first minutes of an emergency.
        </p>
      </section>

      <div className="flex flex-col gap-3">
        {survivalGuides.map((guide) => (
          <Card key={guide.title} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-3">
                <BookOpenCheck className="h-6 w-6 text-success" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-tight">
                {guide.title}
              </h2>
            </div>

            <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm font-semibold text-text-main">
              {guide.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </Card>
        ))}
      </div>
    </main>
  )
}
