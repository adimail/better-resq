import { cn } from '../utils'

interface SkeletonProps {
  className?: string
  label?: string
}

export const Skeleton = ({ className, label = 'Loading' }: SkeletonProps) => (
  <div
    className={cn(
      'animate-pulse rounded-md bg-[var(--color-surface-muted)]',
      className,
    )}
    aria-busy="true"
    aria-label={label}
  />
)

export const PageSkeleton = ({ label = 'Loading screen' }: { label?: string }) => (
  <main className="flex flex-col gap-4 p-4" aria-busy="true" aria-label={label}>
    <Skeleton className="h-8 w-3/5" />
    <Skeleton className="h-4 w-4/5" />
    <div className="grid grid-cols-2 gap-3">
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
    </div>
    <Skeleton className="h-36" />
    <Skeleton className="h-20" />
  </main>
)
