import { Home, Map, PlusCircle, LayoutGrid } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { AppLink } from './AppLink'
import { SosButton } from './SosButton'

export const BottomNav = () => {
  const pendingReports = useAppStore((state) => state.pendingReports)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] h-16">
      <div className="absolute bottom-0 left-0 right-0 h-[96px] pointer-events-none">
        <div className="relative h-full">
          <div
            className="absolute inset-x-0 bottom-0 h-[63px] border-t border-[var(--color-nav-border)] bg-[var(--color-nav-bg)]"
            style={{
              boxShadow: '0 -8px 24px rgba(0,0,0,0.12)',
            }}
          />

          <svg
            width="180"
            height="96"
            viewBox="0 0 180 96"
            className="absolute left-1/2 -translate-x-1/2 top-0"
          >
            <path
              d="
          M 0 33
          C 30 33, 45 0, 90 0
          C 135 0, 150 33, 180 33
          L 180 96
          L 0 96
          Z
        "
              fill="var(--color-nav-bg)"
              stroke="var(--color-nav-border)"
              strokeWidth="1"
            />
          </svg>
        </div>
      </div>

      <div className="relative flex items-center justify-around h-16 px-2">
        <NavLink to="/" label="Home" icon={Home} />
        <NavLink to="/map" label="Map" icon={Map} />

        <div className="relative flex flex-col items-center justify-end h-10 min-w-[100px]">
          <div className="absolute -top-8 flex flex-col items-center">
            <SosButton />
          </div>
        </div>

        <NavLink
          to="/report"
          label="Report"
          icon={PlusCircle}
          badge={pendingReports}
        />
        <NavLink to="/camps" label="Camps" icon={LayoutGrid} />
      </div>
    </nav>
  )
}

const NavLink = ({ to, label, icon: Icon, badge = 0 }: any) => (
  <AppLink
    to={to}
    className="relative flex flex-col items-center gap-1 min-w-[60px] no-underline"
  >
    {({ isActive }) => (
      <>
        {badge > 0 && (
          <span className="absolute -top-2 right-1 rounded-full bg-warning px-1.5 py-0.5 text-[9px] font-black leading-none text-black">
            {badge} Pending
          </span>
        )}
        <Icon
          className={`w-6 h-6 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-text-muted/60'}`}
        />
        <span
          className={`text-[10px] font-black uppercase tracking-tighter transition-colors duration-200 ${isActive ? 'text-primary' : 'text-text-muted/60'}`}
        >
          {label}
        </span>
      </>
    )}
  </AppLink>
)