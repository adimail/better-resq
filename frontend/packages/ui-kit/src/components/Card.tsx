import React from 'react'
import { cn } from '../utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  className?: string
}

export const Card = ({ children, className, ...props }: CardProps) => (
  <div
    className={cn(
      'bg-surface border border-black/10 rounded-lg p-4 shadow-none transition-none',
      className,
    )}
    {...props}
  >
    {children}
  </div>
)