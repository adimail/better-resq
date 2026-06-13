import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react'
import { Button } from './Button'
import { Card } from './Card'
import { PageSkeleton } from './Skeleton'

interface AppStateProps {
  title?: string
  message?: string
  onRetry?: () => void
}

export const LoadingScreen = () => <PageSkeleton label="Loading page" />

export const OfflineScreen = ({
  title = 'No internet connection',
  message = 'Cached screens remain available. New reports are saved locally and sent when signal returns.',
  onRetry,
}: AppStateProps) => (
  <main className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
    <Card className="flex w-full max-w-sm flex-col items-center gap-4 border-black bg-black text-white">
      <WifiOff className="h-12 w-12" aria-hidden="true" />
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight">{title}</h1>
        <p className="mt-2 text-sm font-bold text-white/75">{message}</p>
      </div>
      {onRetry && (
        <Button type="button" variant="secondary" className="border-white text-white" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
          Try Again
        </Button>
      )}
    </Card>
  </main>
)

export const ErrorScreen = ({
  title = 'System error',
  message = 'The screen could not be loaded. Please retry.',
  onRetry,
}: AppStateProps) => (
  <main className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
    <Card className="flex w-full max-w-sm flex-col items-center gap-4 border-danger bg-danger/10">
      <AlertTriangle className="h-12 w-12 text-danger" aria-hidden="true" />
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-danger">
          {title}
        </h1>
        <p className="mt-2 text-sm font-bold text-text-main">{message}</p>
      </div>
      {onRetry && (
        <Button type="button" variant="danger" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
          Retry
        </Button>
      )}
    </Card>
  </main>
)
