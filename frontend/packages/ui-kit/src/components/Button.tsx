import React from 'react'
import { cn } from '../utils'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const variants = {
      primary: 'bg-primary text-white',
      secondary: 'border-2 border-primary text-primary bg-transparent',
      danger: 'bg-danger text-white',
      ghost: 'bg-transparent text-text-main hover:bg-black/5',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
      xl: 'px-8 py-4 text-lg',
    }

    return (
      <button
        ref={ref}
        className={cn(
          'pressable flex min-h-[48px] min-w-[48px] items-center justify-center rounded-md px-4 py-2 font-black uppercase tracking-widest disabled:pointer-events-none disabled:bg-[var(--color-surface-muted)] disabled:text-text-muted disabled:opacity-60 cursor-pointer',
          variants[variant],
          sizes[size],
          className,
        )}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        {children}
      </button>
    )
  },
)
