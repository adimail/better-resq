interface ReportProgressBarProps {
  step: number
}

export const ReportProgressBar = ({ step }: ReportProgressBarProps) => {
  return (
    <div className="grid grid-cols-3 gap-2" aria-label="Report progress">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className={`h-2 rounded-full ${item <= step ? 'bg-primary' : 'bg-[var(--color-surface-muted)]'}`}
        />
      ))}
    </div>
  )
}
