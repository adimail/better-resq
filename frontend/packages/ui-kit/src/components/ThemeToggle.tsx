import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { Button } from './Button'

type ThemeMode = 'light' | 'dark' | 'auto'

export const ThemeToggle = () => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as ThemeMode) || 'auto'
    }
    return 'auto'
  })

  useEffect(() => {
    const root = window.document.documentElement
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)',
    ).matches
    const resolved = mode === 'auto' ? (prefersDark ? 'dark' : 'light') : mode

    root.classList.remove('light', 'dark')
    root.classList.add(resolved)
    root.setAttribute('data-theme', resolved)
    root.style.colorScheme = resolved
    localStorage.setItem('theme', mode)
  }, [mode])

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() =>
        setMode(mode === 'light' ? 'dark' : mode === 'dark' ? 'auto' : 'light')
      }
      className="h-10 min-h-10 gap-2 border border-black/10 bg-black/5 px-3 text-[10px] hover:bg-black/10"
      aria-label={`Theme mode: ${mode}`}
    >
      {mode === 'light' && <Sun className="w-4 h-4 text-warning" />}
      {mode === 'dark' && <Moon className="w-4 h-4 text-primary" />}
      {mode === 'auto' && <Monitor className="w-4 h-4 text-text-main/40" />}
      <span className="hidden xs:inline">{mode}</span>
    </Button>
  )
}
