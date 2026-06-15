import { Button } from '@resq/ui-kit'
import { Upload } from 'lucide-react'

interface ReportNavigationProps {
  step: number
  isSubmitting: boolean
  onNext: () => void
  onBack: () => void
}

export const ReportNavigation = ({
  step,
  isSubmitting,
  onNext,
  onBack,
}: ReportNavigationProps) => {
  return (
    <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
      {step < 3 ? (
        <Button type="button" size="lg" onClick={onNext}>
          Continue
        </Button>
      ) : (
        <Button type="submit" size="lg" isLoading={isSubmitting}>
          <Upload className="mr-2 h-5 w-5" aria-hidden="true" />
          Submit
        </Button>
      )}
      <Button
        type="button"
        variant="secondary"
        size="lg"
        disabled={step === 1 || isSubmitting}
        onClick={onBack}
      >
        Back
      </Button>
    </div>
  )
}
