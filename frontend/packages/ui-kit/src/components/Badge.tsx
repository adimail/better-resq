import React from 'react'
import { cn } from '../utils'

interface BadgeProps {
  children: React.ReactNode
  variant: 'success' | 'warning' | 'danger' | 'neutral'
  className?: string
}

export const Badge = ({ children, variant, className }: BadgeProps) => {
  const styles = {
    success: 'bg-success text-white border-transparent',
    warning: 'bg-warning text-white border-transparent',
    danger: 'bg-danger text-white border-transparent',
    neutral: 'bg-black/10 text-text-main border-transparent',
  }

  return (
    <span
      className={cn(
        'px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border transition-none',
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
