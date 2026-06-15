import { useState, useMemo, useEffect } from 'react'
import type { DisasterType, Location } from '@resq/types'
import { useAppStore } from '../../../store/useAppStore'

export const useReportForm = () => {
  const location = useAppStore((state) => state.currentLocation)

  const [step, setStep] = useState(1)
  const [disasterType, setDisasterType] = useState<DisasterType>('flood')
  const [description, setDescription] = useState('')
  const [photoName, setPhotoName] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [reportLocation, setReportLocation] = useState<Location | undefined>(
    location,
  )

  useEffect(() => {
    if (!reportLocation && location) {
      setReportLocation(location)
    }
  }, [location, reportLocation])

  const descriptionError = useMemo(() => {
    if (!description) return undefined
    return description.trim().length < 10
      ? 'Description must be at least 10 characters'
      : undefined
  }, [description])

  const resetForm = () => {
    setDescription('')
    setPhotoName('')
    setPhotoFile(null)
    setStep(1)
  }

  return {
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
  }
}
