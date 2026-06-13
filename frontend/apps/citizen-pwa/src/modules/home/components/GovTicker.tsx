import { Info } from 'lucide-react'

export const GovTicker = () => {
  return (
    <div className="flex items-center bg-[var(--color-surface-muted)] border-y border-[var(--color-border)] h-10 overflow-hidden relative">
      <div className="px-3 bg-primary h-full flex items-center z-10 absolute left-0 shadow-[10px_0_10px_rgba(0,0,0,0.1)]">
        <Info className="w-4 h-4 text-white" />
        <span className="text-[10px] font-black uppercase text-white tracking-widest ml-2 hidden xs:block">
          Gov Alerts
        </span>
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          white-space: nowrap;
          animation: marquee 25s linear infinite;
        }
      `}</style>
      <div className="flex-1 overflow-hidden relative h-full w-full pl-28">
        <div className="animate-marquee h-full flex items-center text-xs font-bold text-text-main uppercase tracking-tight">
          <span className="mx-4 text-danger">
            • MANDATORY EVACUATION IN SECTOR 4
          </span>
          <span className="mx-4">• HIGHWAY 9 CLOSED DUE TO FLOODING</span>
          <span className="mx-4 text-success">
            • COMMUNITY SHELTER AT CITY HALL IS NOW OPEN
          </span>
          <span className="mx-4">• AVOID DOWNTOWN AREA</span>
        </div>
      </div>
    </div>
  )
}
