import { AlertTriangle, ShieldCheck } from 'lucide-react'
import { Card } from '@resq/ui-kit'
import { useAppStore } from '../../../store/useAppStore'
import { useMapResources } from '../../../hooks/useSync'

export const LiveStatusBanner = () => {
  const location = useAppStore((state) => state.currentLocation)
  const { dangerZones } = useMapResources(location)
  const activeZones = dangerZones.data?.filter((zone) => zone.is_active) ?? []
  const highestSeverity = activeZones.reduce(
    (max, zone) => Math.max(max, zone.severity_level),
    0,
  )
  const isDanger = highestSeverity >= 4

  return (
    <Card
      className={`m-4 p-4 flex items-center gap-4 ${
        isDanger
          ? 'bg-danger/10 border-danger/30'
          : 'bg-success/10 border-success/30'
      }`}
    >
      <div
        className={`p-3 rounded-full ${isDanger ? 'bg-danger/20' : 'bg-success/20'}`}
      >
        {isDanger ? (
          <AlertTriangle className="w-8 h-8 text-danger" />
        ) : (
          <ShieldCheck className="w-8 h-8 text-success" />
        )}
      </div>
      <div className="flex-1">
        <p
          className={`text-[10px] font-black uppercase tracking-widest ${
            isDanger ? 'text-danger' : 'text-success'
          }`}
        >
          Live Status Monitoring
        </p>
        <h3 className="text-lg font-extrabold text-text-main tracking-tight leading-none mt-1">
          {dangerZones.isLoading
            ? 'Scanning area...'
            : isDanger
              ? `Severity ${highestSeverity} Hazard Nearby`
              : activeZones.length > 0
                ? `${activeZones.length} Active Hazard${activeZones.length === 1 ? '' : 's'}`
                : 'No Active Hazards'}
        </h3>
      </div>
    </Card>
  )
}
