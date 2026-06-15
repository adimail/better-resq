import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { incidentService } from '@resq/api-client'
import { useAppStore } from '../../../store/useAppStore'
import type { ApiError, DisasterType, Location } from '@resq/types'

interface SubmitPayload {
  disasterType: DisasterType
  description: string
  photoName: string
  photoFile: File | null
  reportLocation: Location | undefined
  aiScore: number
  resetForm: () => void
}

export const useSubmitReport = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const incrementPendingReports = useAppStore(
    (state) => state.incrementPendingReports,
  )

  const queueOfflineReport = (
    payload: Omit<SubmitPayload, 'photoFile' | 'resetForm'>,
  ) => {
    const pending = JSON.parse(
      localStorage.getItem('resq_pending_reports') || '[]',
    )
    pending.push({
      disaster_type: payload.disasterType,
      location: payload.reportLocation,
      description: payload.description.trim(),
      photo_name: payload.photoName || undefined,
      created_at: new Date().toISOString(),
    })
    localStorage.setItem('resq_pending_reports', JSON.stringify(pending))
    incrementPendingReports()
  }

  const submitReport = async (payload: SubmitPayload) => {
    if (!payload.reportLocation) {
      toast.error('Location required to submit report')
      return
    }

    if (payload.description.trim().length < 10) {
      toast.error('Description must be at least 10 characters')
      return
    }

    setIsSubmitting(true)

    try {
      if (!navigator.onLine) {
        queueOfflineReport(payload)
        payload.resetForm()
        toast.success(
          'Report saved locally. Will transmit when signal is restored.',
        )
        navigate({ to: '/' })
        return
      }

      let finalImageKey = ''

      if (payload.photoFile) {
        try {
          const { upload_url, api_key, timestamp, signature } =
            await incidentService.getUploadUrl(
              payload.photoFile.type,
              payload.photoFile.size,
            )

          const formData = new FormData()
          formData.append('file', payload.photoFile)
          formData.append('api_key', api_key)
          formData.append('timestamp', timestamp)
          formData.append('signature', signature)

          const uploadRes = await fetch(upload_url, {
            method: 'POST',
            body: formData,
          })

          const uploadData = await uploadRes.json()
          finalImageKey = uploadData.secure_url
        } catch (e) {
          toast.error('Failed to upload image. Please try again.')
          setIsSubmitting(false)
          return
        }
      }

      await incidentService.submit({
        disaster_type: payload.disasterType,
        location: payload.reportLocation,
        description: payload.description.trim(),
        image_key: finalImageKey || undefined,
        ai_confidence_score: payload.aiScore,
      })

      payload.resetForm()
      toast.success('Report submitted successfully')
      navigate({ to: '/' })
    } catch (err: any) {
      const apiErr = err as ApiError
      toast.error(apiErr.detail || apiErr.title || 'Failed to submit report')
    } finally {
      setIsSubmitting(false)
    }
  }

  return { isSubmitting, submitReport }
}
