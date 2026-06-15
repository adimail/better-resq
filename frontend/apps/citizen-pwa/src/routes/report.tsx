import React from 'react'
import { createRoute, Navigate } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { Card } from '@resq/ui-kit'
import { toast } from 'sonner'
import { useAppStore } from '../store/useAppStore'
import {
  useImageClassifier,
  useReportForm,
  useSubmitReport,
  ReportProgressBar,
  Step1DisasterType,
  Step2Location,
  Step3Details,
  ReportNavigation,
} from '../modules/report'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/report',
  component: ReportPage,
})

function ReportPage() {
  const isAuthenticated = Boolean(localStorage.getItem('access_token'))
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" />
  }

  const location = useAppStore((state) => state.currentLocation)

  const { aiScore, setAiScore, classifyImage } = useImageClassifier()
  const {
    step,
    setStep,
    disasterType,
    setDisasterType,
    description,
    setDescription,
    photoName,
    setPhotoName,
    photoFile,
    setPhotoFile,
    reportLocation,
    setReportLocation,
    descriptionError,
    resetForm,
  } = useReportForm()

  const { isSubmitting, submitReport } = useSubmitReport()

  const handleNext = () => {
    if (step === 2 && !reportLocation) {
      toast.error('Please select a location')
      return
    }
    setStep((v) => Math.min(3, v + 1))
  }

  const handleBack = () => {
    setStep((v) => Math.max(1, v - 1))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (step !== 3) return

    submitReport({
      disasterType,
      description,
      photoName,
      photoFile,
      reportLocation,
      aiScore,
      resetForm,
    })
  }

  return (
    <main className="p-4">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <section>
          <h1 className="text-2xl font-black uppercase tracking-tight">
            Report Incident
          </h1>
          <p className="mt-1 text-sm font-bold text-text-muted">
            Submit verified observations from your device.
          </p>
        </section>

        {!location && !reportLocation && (
          <Card className="border-warning bg-warning/10">
            <p className="text-sm font-black uppercase text-warning">
              Enable location or manually select the incident area.
            </p>
          </Card>
        )}

        <ReportProgressBar step={step} />

        {step === 1 && (
          <Step1DisasterType
            disasterType={disasterType}
            setDisasterType={setDisasterType}
          />
        )}

        <div className={step === 2 ? 'block' : 'hidden'}>
          <Step2Location
            reportLocation={reportLocation}
            setReportLocation={setReportLocation}
          />
        </div>

        {step === 3 && (
          <Step3Details
            description={description}
            setDescription={setDescription}
            photoName={photoName}
            setPhotoName={setPhotoName}
            setPhotoFile={setPhotoFile}
            setAiScore={setAiScore}
            classifyImage={classifyImage}
            descriptionError={descriptionError}
          />
        )}

        <ReportNavigation
          step={step}
          isSubmitting={isSubmitting}
          onNext={handleNext}
          onBack={handleBack}
        />
      </form>
    </main>
  )
}
