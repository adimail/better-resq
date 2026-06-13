import { useEffect, useRef, useState } from 'react'
import { Radio, ShieldCheck } from 'lucide-react'
import { sosService } from '@resq/api-client'
import { toast } from 'sonner'
import type { ApiError } from '@resq/types'
import { useAppStore } from '../store/useAppStore'
import { Button, Modal } from '@resq/ui-kit'

const HOLD_DURATION_MS = 1800

type NavigatorWithBattery = Navigator & {
  getBattery?: () => Promise<{ level: number }>
}

export const SosButton = () => {
  const [isPressing, setIsPressing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [batteryLevel, setBatteryLevel] = useState<number>()
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [isResolving, setIsResolving] = useState(false)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const frameRef = useRef<number | null>(null)
  const startedAtRef = useRef<number>(0)

  const location = useAppStore((state) => state.currentLocation)
  const activeSosId = useAppStore((state) => state.activeSosId)
  const setActiveSos = useAppStore((state) => state.setActiveSos)
  const clearActiveSos = useAppStore((state) => state.clearActiveSos)

  useEffect(() => {
    const batteryApi = navigator as NavigatorWithBattery
    batteryApi
      .getBattery?.()
      .then((battery) => setBatteryLevel(Math.round(battery.level * 100)))
      .catch(() => setBatteryLevel(undefined))
  }, [])

  const stopProgress = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    timerRef.current = null
    frameRef.current = null
    setIsPressing(false)
    setProgress(0)
  }

  const handleStart = () => {
    if (!location) {
      toast.error('Location required to send SOS')
      return
    }
    if (timerRef.current) return
    setIsPressing(true)
    startedAtRef.current = performance.now()
    const updateProgress = () => {
      const elapsed = performance.now() - startedAtRef.current
      setProgress(Math.min(elapsed / HOLD_DURATION_MS, 1))
      if (elapsed < HOLD_DURATION_MS) {
        frameRef.current = requestAnimationFrame(updateProgress)
      }
    }
    frameRef.current = requestAnimationFrame(updateProgress)
    timerRef.current = setTimeout(async () => {
      if (activeSosId) {
        setShowResolveModal(true)
        if (navigator.vibrate) navigator.vibrate(100)
      } else {
        try {
          const payload = {
            location,
            message: 'Emergency SOS triggered',
            ...(batteryLevel !== undefined
              ? { battery_level: batteryLevel }
              : {}),
          }
          const res = await sosService.trigger(payload)
          setActiveSos(res.id, 'active')

          if (!localStorage.getItem('access_token')) {
            toast.warning(
              'Anonymous SOS Sent. Responders cannot contact you. Please log in to share details.',
              { duration: 6000 },
            )
          } else {
            toast.error('SOS SIGNAL SENT', { duration: 10000 })
          }

          if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500])
        } catch (err: any) {
          const apiErr = err as ApiError
          toast.error(apiErr.detail || apiErr.title || 'Failed to send SOS')
        }
      }
      stopProgress()
    }, HOLD_DURATION_MS)
  }

  const handleEnd = () => stopProgress()

  const handleResolve = async () => {
    if (!activeSosId) return
    setIsResolving(true)
    try {
      await sosService.updateStatus(activeSosId, 'resolved')
      clearActiveSos()
      setShowResolveModal(false)
      toast.success('SOS signal marked as resolved')
    } catch (err: any) {
      const apiErr = err as ApiError
      toast.error(apiErr.detail || apiErr.title || 'Failed to resolve SOS')
    } finally {
      setIsResolving(false)
    }
  }

  const SIZE = 56
  const RADIUS = 24
  const circumference = 2 * Math.PI * RADIUS
  const strokeDashoffset = circumference * (1 - progress)
  const isActiveSos = Boolean(activeSosId)

  return (
    <div className="flex flex-col items-center">
      <Modal
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        title="Resolve SOS?"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm font-bold text-text-main">
            Do you want to resolve this SOS signal? This will notify responders
            that you are now safe.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              className="w-full bg-success hover:bg-success/90"
              onClick={handleResolve}
              isLoading={isResolving}
            >
              <ShieldCheck className="w-5 h-5 mr-2" />
              Yes, I am Safe
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setShowResolveModal(false)}
              disabled={isResolving}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        {isActiveSos && (
          <>
            <span
              className="absolute inset-0 rounded-full bg-danger opacity-30 animate-ping"
              style={{ animationDuration: '1.2s' }}
            />
            <span
              className="absolute inset-0 rounded-full bg-danger opacity-20 animate-ping"
              style={{ animationDuration: '1.8s', animationDelay: '0.3s' }}
            />
          </>
        )}

        <Button
          type="button"
          variant="danger"
          aria-label={isActiveSos ? 'Hold to Resolve SOS' : 'Hold to send SOS'}
          onPointerDown={handleStart}
          onPointerUp={handleEnd}
          onPointerCancel={handleEnd}
          onPointerLeave={handleEnd}
          className={`relative flex items-center justify-center rounded-full p-0 focus:outline-none select-none touch-none cursor-pointer`}
          style={{ width: SIZE, height: SIZE }}
        >
          <svg
            width={SIZE}
            height={SIZE}
            viewBox="0 0 56 56"
            className="absolute inset-0 -rotate-90"
          >
            <circle
              cx="28"
              cy="28"
              r={RADIUS}
              fill="none"
              className="stroke-black/15 dark:stroke-white/15"
              strokeWidth="3.5"
            />
            {isPressing && (
              <circle
                cx="28"
                cy="28"
                r={RADIUS}
                fill="none"
                stroke="white"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 0.016s linear' }}
              />
            )}
          </svg>

          <span
            className={`
              absolute rounded-full flex items-center justify-center transition-all duration-150 shadow-lg
              ${isPressing ? 'bg-red-800 scale-90' : 'bg-danger'}
            `}
            style={{ inset: 3 }}
          >
            <Radio className="w-6 h-6 text-white relative z-10" />
          </span>
        </Button>
      </div>

      <span
        className={`mt-1.5 text-[10px] font-black uppercase tracking-widest leading-none ${
          isActiveSos ? 'text-danger animate-pulse' : 'text-danger'
        }`}
      >
        {isActiveSos ? 'ACTIVE' : 'SOS'}
      </span>

      {isActiveSos && (
        <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-danger/70 leading-none">
          HOLD TO RESOLVE
        </span>
      )}
    </div>
  )
}

