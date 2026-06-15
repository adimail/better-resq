import React, { useEffect, useMemo, useState } from 'react'
import { createRoute, Navigate, useNavigate } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { Badge, Button, Card } from '@resq/ui-kit'
import { incidentService } from '@resq/api-client'
import type { DisasterType, ApiError, Location } from '@resq/types'
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Camera,
  Flame,
  LocateFixed,
  MapPin,
  Upload,
  Waves,
  Wind,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '../store/useAppStore'
import { useMap } from '../hooks/useMap'
import * as tf from '@tensorflow/tfjs'

const disasterTypes: Array<{
  value: DisasterType
  label: string
  icon: any
}> = [
  { value: 'flood', label: 'Flood', icon: Waves },
  { value: 'fire', label: 'Fire', icon: Flame },
  { value: 'quake', label: 'Quake', icon: AlertTriangle },
  { value: 'storm', label: 'Storm', icon: Wind },
  { value: 'structure_collapse', label: 'Collapse', icon: Building2 },
]

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

  const navigate = useNavigate()
  const location = useAppStore((state) => state.currentLocation)
  const incrementPendingReports = useAppStore(
    (state) => state.incrementPendingReports,
  )

  const [disasterType, setDisasterType] = useState<DisasterType>('flood')
  const [description, setDescription] = useState('')
  const [photoName, setPhotoName] = useState('')
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reportLocation, setReportLocation] = useState<Location | undefined>(
    location,
  )
  const [aiScore, setAiScore] = useState<number>(1.0)

  const { mapContainer, mapRef, isLoaded } = useMap({
    center: reportLocation
      ? [reportLocation.lng, reportLocation.lat]
      : [73.8567, 18.5204],
    zoom: 15,
  })

  useEffect(() => {
    if (!reportLocation && location) {
      setReportLocation(location)
    }
  }, [location, reportLocation])

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return
    const map = mapRef.current

    const onMove = () => {
      const center = map.getCenter()
      setReportLocation({ lat: center.lat, lng: center.lng })
    }

    map.on('move', onMove)

    return () => {
      map.off('move', onMove)
    }
  }, [isLoaded])

  const jumpToCurrentLocation = () => {
    if (!navigator.geolocation || !mapRef.current) return

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setReportLocation(loc)
        mapRef.current?.flyTo({ center: [loc.lng, loc.lat], zoom: 16 })
      },
      () => {},
      { enableHighAccuracy: true },
    )
  }

  const handleImageSelection = async (file: File) => {
    setPhotoName(file.name)
    const img = new Image()
    img.src = URL.createObjectURL(file)
    await new Promise((r) => (img.onload = r))
    const canvas = document.createElement('canvas')
    canvas.width = 224
    canvas.height = 224
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(img, 0, 0, 224, 224)

    try {
      const model = await tf.loadLayersModel('/models/disaster-net/model.json')
      const tensor = tf.browser
        .fromPixels(canvas)
        .expandDims(0)
        .toFloat()
        .div(tf.scalar(255))
      const prediction = model.predict(tensor) as tf.Tensor
      const data = await prediction.data()
      const score = data[0]
      setAiScore(score)
      if (score < 0.4) {
        toast.warning(
          'This image does not appear to show a disaster. Are you sure you want to upload it?',
          { duration: 6000 },
        )
      }
    } catch (e) {
      setAiScore(1.0)
    }
  }

  const descriptionError = useMemo(() => {
    if (!description) return undefined
    return description.trim().length < 10
      ? 'Description must be at least 10 characters'
      : undefined
  }, [description])

  const queueOfflineReport = () => {
    const pending = JSON.parse(
      localStorage.getItem('resq_pending_reports') || '[]',
    )
    pending.push({
      disaster_type: disasterType,
      location: reportLocation,
      description: description.trim(),
      photo_name: photoName || undefined,
      created_at: new Date().toISOString(),
    })
    localStorage.setItem('resq_pending_reports', JSON.stringify(pending))
    incrementPendingReports()
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (step !== 3) return

    if (!reportLocation) {
      toast.error('Location required to submit report')
      return
    }
    if (description.trim().length < 10) {
      toast.error('Description must be at least 10 characters')
      return
    }

    setIsSubmitting(true)
    try {
      if (!navigator.onLine) {
        queueOfflineReport()
        setDescription('')
        setPhotoName('')
        setStep(1)
        toast.success(
          'Report saved locally. Will transmit when signal is restored.',
        )
        navigate({ to: '/' })
        return
      }

      let finalImageKey = ''
      if (photoName) {
        const fileInput = document.getElementById('photo') as HTMLInputElement
        const file = fileInput.files?.[0]
        if (file) {
          try {
            const { upload_url, api_key, timestamp, signature } =
              await incidentService.getUploadUrl(file.type, file.size)

            const formData = new FormData()
            formData.append('file', file)
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
      }

      await incidentService.submit({
        disaster_type: disasterType,
        location: reportLocation,
        description: description.trim(),
        image_key: finalImageKey || undefined,
        ai_confidence_score: aiScore,
      })

      setDescription('')
      setPhotoName('')
      setStep(1)
      toast.success('Report submitted successfully')
      navigate({ to: '/' })
    } catch (err: any) {
      const apiErr = err as ApiError
      toast.error(apiErr.detail || apiErr.title || 'Failed to submit report')
    } finally {
      setIsSubmitting(false)
    }
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

        <div className="grid grid-cols-3 gap-2" aria-label="Report progress">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className={`h-2 rounded-full ${item <= step ? 'bg-primary' : 'bg-[var(--color-surface-muted)]'}`}
            />
          ))}
        </div>

        {step === 1 && (
          <section className="grid grid-cols-2 gap-3">
            {disasterTypes.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                type="button"
                variant={disasterType === value ? 'primary' : 'secondary'}
                onClick={() => setDisasterType(value)}
                className="flex min-h-28 flex-col items-start justify-between p-4 text-left"
              >
                <Icon className="h-10 w-10" aria-hidden="true" />
                <span className="text-sm font-black uppercase tracking-tight">
                  {label}
                </span>
              </Button>
            ))}
          </section>
        )}

        <div
          className={`flex flex-col gap-4 ${step === 2 ? 'flex' : 'hidden'}`}
        >
          <div className="relative h-80 w-full rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-map-land)]">
            <div ref={mapContainer} className="h-full w-full" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-8">
              <MapPin className="h-10 w-10 text-danger drop-shadow-xl" />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={jumpToCurrentLocation}
              className="absolute bottom-4 right-4 h-12 w-12 min-w-0 rounded-full p-0 shadow-lg bg-surface border-none"
            >
              <LocateFixed className="h-5 w-5 text-primary" />
            </Button>
          </div>
          <Card className="flex items-center justify-between bg-[var(--color-surface-muted)] py-3 px-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                Incident Coordinates
              </p>
              <p className="text-sm font-bold font-mono text-text-main mt-0.5">
                {reportLocation
                  ? `${reportLocation.lat.toFixed(5)}, ${reportLocation.lng.toFixed(5)}`
                  : 'Unknown'}
              </p>
            </div>
            <Badge variant="neutral">Adjustable</Badge>
          </Card>
        </div>

        {step === 3 && (
          <Card className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted">
                Photo
              </label>
              <label className="pressable flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] p-4 text-center">
                <Camera className="h-8 w-8 text-primary" aria-hidden="true" />
                <span className="text-xs font-black uppercase text-text-main">
                  {photoName || 'Add photo or skip'}
                </span>
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0]
                    if (file) {
                      handleImageSelection(file)
                    }
                  }}
                />
              </label>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className={`min-h-32 resize-none rounded-lg border bg-bg-base p-3 text-base font-semibold text-text-main ${descriptionError ? 'border-danger' : 'border-[var(--color-border)]'}`}
                required
              />
              {descriptionError && (
                <p className="flex items-center gap-1 text-xs font-black uppercase text-danger">
                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                  {descriptionError}
                </p>
              )}
            </div>
          </Card>
        )}

        <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
          {step < 3 ? (
            <Button
              type="button"
              size="lg"
              onClick={(e) => {
                e.preventDefault()
                if (step === 2 && !reportLocation) {
                  toast.error('Please select a location')
                  return
                }
                setStep((v) => Math.min(3, v + 1))
              }}
            >
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
            onClick={(e) => {
              e.preventDefault()
              setStep((v) => Math.max(1, v - 1))
            }}
          >
            Back
          </Button>
        </div>
      </form>
    </main>
  )
}
