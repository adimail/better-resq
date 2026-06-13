import { ShieldAlert } from 'lucide-react'
import { Button } from './Button'

interface NotFoundProps {
  onAction?: () => void
  actionText?: string
  title?: string
  message?: string
}

export const NotFound = ({
  onAction,
  actionText = 'Back to Home',
  title = '404',
  message = 'The page you are looking for does not exist or has been moved.',
}: NotFoundProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="w-20 h-20 bg-danger/10 rounded-full flex items-center justify-center mb-6">
        <ShieldAlert className="w-12 h-12 text-danger" />
      </div>

      <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 text-text-main">
        {title}
      </h1>

      <p className="text-sm font-bold uppercase tracking-widest text-text-main/40 mb-8 max-w-[240px]">
        {message}
      </p>

      {onAction && (
        <Button size="lg" className="px-10" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  )
}
