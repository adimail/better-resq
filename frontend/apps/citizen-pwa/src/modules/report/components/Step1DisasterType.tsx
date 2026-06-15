import { Button } from '@resq/ui-kit'
import { AlertTriangle, Building2, Flame, Waves, Wind } from 'lucide-react'
import type { DisasterType } from '@resq/types'

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

interface Step1DisasterTypeProps {
  disasterType: DisasterType
  setDisasterType: (type: DisasterType) => void
}

export const Step1DisasterType = ({
  disasterType,
  setDisasterType,
}: Step1DisasterTypeProps) => {
  return (
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
  )
}
