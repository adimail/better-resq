import React from 'react'
import { cn } from '../utils'
import { X } from 'lucide-react'
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
}: {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        className={cn(
          'bg-surface w-full max-w-md rounded-xl shadow-xl border border-[var(--color-border)] flex flex-col overflow-hidden',
          className,
        )}
      >
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
            <span className="font-black uppercase text-lg">{title}</span>
            <button
              onClick={onClose}
              className="p-1 hover:bg-black/5 rounded-full text-text-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
