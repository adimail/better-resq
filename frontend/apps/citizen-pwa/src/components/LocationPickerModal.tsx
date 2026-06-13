import { useNavigate } from '@tanstack/react-router'
import { Button, Modal } from '@resq/ui-kit'
import { useAppStore } from '../store/useAppStore'
import { MapPin, LocateFixed } from 'lucide-react'

export function LocationPickerModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const navigate = useNavigate()
  const setLocation = useAppStore((state) => state.setLocation)

  const handleMyLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }
        setLocation(loc, `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`, false)
        onClose()
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const handleCustomLocation = () => {
    onClose()
    navigate({ to: '/profile' })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Location Source">
      <div className="flex flex-col gap-4">
        <p className="text-xs font-bold text-text-muted">
          Choose how you want to provide your emergency location.
        </p>
        <Button size="lg" className="w-full" onClick={handleMyLocation}>
          <LocateFixed className="w-5 h-5 mr-2" />
          Use GPS Location
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={handleCustomLocation}
        >
          <MapPin className="w-5 h-5 mr-2" />
          Set Custom Location
        </Button>
      </div>
    </Modal>
  )
}
