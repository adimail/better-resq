import { createRoute } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { Card } from '@resq/ui-kit'
import { Phone, ShieldAlert } from 'lucide-react'
import { emergencyContacts } from '../content/emergency'
import { AppLink } from '../components/AppLink'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/helplines',
  component: HelplinesPage,
})

function HelplinesPage() {
  return (
    <main className="p-4 flex flex-col gap-4">
      <section>
        <h1 className="text-2xl font-black uppercase tracking-tight">
          Helplines
        </h1>
        <p className="mt-1 text-sm font-bold text-text-muted">
          Direct emergency numbers for India. Use SOS when responders need your
          live app location.
        </p>
      </section>

      <div className="flex flex-col gap-3">
        {emergencyContacts.map((contact) => (
          <Card key={contact.number} className="flex items-center gap-4">
            <div className="rounded-lg bg-danger/10 p-3">
              <ShieldAlert className="h-6 w-6 text-danger" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-black uppercase tracking-tight">
                {contact.label}
              </h2>
              <p className="text-xs font-bold text-text-muted">
                {contact.scope}
              </p>
              <p className="mt-1 text-xl font-black text-text-main">
                {contact.number}
              </p>
            </div>

            <AppLink
              href={`tel:${contact.number}`}
              ariaLabel={`Call ${contact.label}`}
              className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-black uppercase tracking-widest text-white"
            >
              <Phone className="h-4 w-4" />
            </AppLink>
          </Card>
        ))}
      </div>
    </main>
  )
}
