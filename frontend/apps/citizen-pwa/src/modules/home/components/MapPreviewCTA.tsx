import { Map, ArrowRight } from 'lucide-react'
import { AppLink } from '../../../components/AppLink'

export const MapPreviewCTA = () => {
  return (
    <div className="px-4">
      <AppLink
        to="/map"
        className="block relative h-32 rounded-xl overflow-hidden border border-[var(--color-border)] no-underline group active:scale-[0.98] transition-transform"
      >
        <div className="absolute inset-0 bg-[var(--color-map-land)] opacity-50" />
        <div
          className="absolute inset-0 flex"
          style={{
            background:
              'radial-gradient(circle at center, transparent 0%, var(--color-surface) 100%)',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary p-3 rounded-full shadow-lg">
              <Map className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase text-text-main">
                Live Map Preview
              </h3>
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest">
                Danger Zones & Camps
              </p>
            </div>
          </div>
          <ArrowRight className="w-6 h-6 text-primary group-active:translate-x-1 transition-transform" />
        </div>
      </AppLink>
    </div>
  )
}
