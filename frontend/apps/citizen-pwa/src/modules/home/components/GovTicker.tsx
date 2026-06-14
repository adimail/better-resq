import { Info, ShieldCheck, AlertTriangle, Building2 } from 'lucide-react'
import { useNotifications } from '../../../hooks/useNotifications'
import { useMapResources } from '../../../hooks/useSync'
import { useAppStore } from '../../../store/useAppStore'

export const GovTicker = () => {
  const { notifications } = useNotifications()
  const location = useAppStore((state) => state.currentLocation)
  const { dangerZones, camps } = useMapResources(location)

  const activeAlerts = notifications.filter(
    (n) => n.severity === 'danger' || n.severity === 'warning',
  )
  const activeZones = dangerZones.data?.filter((z) => z.is_active) || []
  const activeCamps = camps.data || []

  const tickerItems = [
    ...activeAlerts.map((a) => ({
      id: `notif-${a.id}`,
      icon: AlertTriangle,
      text: `${a.title}: ${a.message}`,
      color: a.severity === 'danger' ? 'text-danger' : 'text-warning',
    })),
    ...activeZones.map((z) => ({
      id: `zone-${z.id}`,
      icon: AlertTriangle,
      text: `SEVERITY ${z.severity_level} ${z.disaster_type.replace('_', ' ')} HAZARD`,
      color: 'text-danger',
    })),
    ...activeCamps.map((c) => ({
      id: `camp-${c.id}`,
      icon: Building2,
      text: `${c.camp_type} CAMP: ${c.name} (${c.stock_status.replace('_', ' ')})`,
      color: 'text-success',
    })),
  ]

  if (tickerItems.length === 0) {
    return (
      <div className="flex items-center bg-[var(--color-surface-muted)] border-y border-[var(--color-border)] h-10 overflow-hidden relative">
        <div className="px-3 bg-success h-full flex items-center z-10 absolute left-0 shadow-[10px_0_10px_rgba(0,0,0,0.1)]">
          <ShieldCheck className="w-4 h-4 text-white" />
          <span className="text-[10px] font-black uppercase text-white tracking-widest ml-2 hidden xs:block">
            Status
          </span>
        </div>
        <div className="flex-1 flex items-center pl-28 md:pl-32 h-full">
          <span className="text-xs font-black text-success uppercase tracking-widest ml-4">
            No imminent warnings in your area
          </span>
        </div>
      </div>
    )
  }

  const AlertItems = () => (
    <>
      {tickerItems.map((item) => (
        <span
          key={item.id}
          className={`mx-6 flex items-center gap-2 ${item.color}`}
        >
          <item.icon className="w-3.5 h-3.5" />
          {item.text}
        </span>
      ))}
    </>
  )

  const RepeatedItems = () => (
    <div className="flex items-center w-max">
      <AlertItems />
      <AlertItems />
      <AlertItems />
      <AlertItems />
    </div>
  )

  return (
    <div className="flex items-center bg-[var(--color-surface-muted)] border-y border-[var(--color-border)] h-10 overflow-hidden relative">
      <div className="px-3 bg-danger h-full flex items-center z-10 absolute left-0 shadow-[10px_0_10px_rgba(0,0,0,0.1)]">
        <Info className="w-4 h-4 text-white" />
        <span className="text-[10px] font-black uppercase text-white tracking-widest ml-2 hidden xs:block">
          Gov Alerts
        </span>
      </div>
      <style>{`
        @keyframes marquee-seamless {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-seamless {
          display: flex;
          width: max-content;
          animation: marquee-seamless 40s linear infinite;
        }
        .animate-marquee-seamless:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="flex-1 overflow-hidden relative h-full w-full pl-28 md:pl-32 flex items-center">
        <div className="animate-marquee-seamless h-full items-center text-xs font-black uppercase tracking-tight">
          <RepeatedItems />
          <RepeatedItems />
        </div>
      </div>
    </div>
  )
}
