import { AlertTriangle, RefreshCw } from 'lucide-react'
import { cn } from '../utils'

export const OfflineBanner = ({
  status,
  cachedAt,
}: {
  status: 'offline' | 'reconnecting'
  cachedAt?: string
}) => (
  <div
    className={cn(
      'fixed top-0 left-0 right-0 h-10 z-[600] flex items-center justify-center gap-2 px-4 text-white font-bold text-sm transition-none',
      status === 'offline' ? 'bg-black' : 'bg-primary',
    )}
  >
    {status === 'offline' ? (
      <>
        <AlertTriangle className="w-4 h-4" />
        <span>
          OFFLINE. SHOWING CACHED DATA{cachedAt ? ` FROM ${cachedAt}` : ''}.
        </span>
      </>
    ) : (
      <>
        <RefreshCw className="w-4 h-4" />
        <span>RECONNECTING...</span>
      </>
    )}
  </div>
)
