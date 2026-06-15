import { Card } from '@resq/ui-kit'
import { AlertCircle, Camera } from 'lucide-react'

interface Step3DetailsProps {
  description: string
  setDescription: (val: string) => void
  photoName: string
  setPhotoName: (val: string) => void
  setPhotoFile: (file: File) => void
  setAiScore: (score: number) => void
  classifyImage: (file: File) => Promise<number>
  descriptionError: string | undefined
}

export const Step3Details = ({
  description,
  setDescription,
  photoName,
  setPhotoName,
  setPhotoFile,
  setAiScore,
  classifyImage,
  descriptionError,
}: Step3DetailsProps) => {
  return (
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
            onChange={async (event) => {
              const file = event.currentTarget.files?.[0]
              if (file) {
                setPhotoName(file.name)
                setPhotoFile(file)
                const score = await classifyImage(file)
                setAiScore(score)
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
  )
}
