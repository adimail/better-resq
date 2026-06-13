export const Footer = () => {
  const year = new Date().getFullYear()
  return (
    <footer className="w-full px-4 flex flex-col items-center gap-6 text-center transition-none">
      <div className="flex mt-10 flex-col gap-1">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-main/40">
          ResQ Emergency Coordination
        </span>
        <span className="text-[10px] font-medium text-text-main/30">
          v1.0.0-alpha • {year}
        </span>
      </div>
      <div className="text-[10px] leading-relaxed text-text-main/20 max-w-[240px] uppercase font-bold">
        Designed for extreme resilience. Offline-first synchronization.
        Optimized for low-bandwidth cellular networks.
      </div>
    </footer>
  )
}
