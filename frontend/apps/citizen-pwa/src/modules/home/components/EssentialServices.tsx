import { Map, Phone, BookOpen, Cloud } from 'lucide-react'
import { AppLink } from '../../../components/AppLink'

const ActionCard = ({ icon: Icon, label, desc, color, to }: any) => (
  <AppLink
    to={to}
    className="flex flex-col items-start p-4 bg-surface border border-[var(--color-border)] rounded-lg text-left active:bg-black/5 transition-none no-underline text-text-main"
  >
    <Icon className={`w-8 h-8 ${color} mb-3`} />
    <span className="text-sm font-black uppercase tracking-tighter leading-none mb-1">
      {label}
    </span>
    <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">
      {desc}
    </span>
  </AppLink>
)

export const EssentialServices = () => {
  return (
    <div className="px-4">
      <h2 className="text-sm font-black uppercase tracking-tight text-text-muted mb-3">
        Essential Services
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <ActionCard
          icon={Map}
          label="Evacuation Map"
          desc="Live hazards and camps"
          color="text-primary"
          to="/map"
        />
        <ActionCard
          icon={Phone}
          label="Helplines"
          desc="Verified emergency contacts"
          color="text-orange-600"
          to="/helplines"
        />
        <ActionCard
          icon={BookOpen}
          label="Survival Guides"
          desc="Preparedness and first aid"
          color="text-emerald-600"
          to="/survival-guides"
        />
        <ActionCard
          icon={Cloud}
          label="Weather"
          desc="Local conditions"
          color="text-sky-600"
          to="/weather"
        />
      </div>
    </div>
  )
}
