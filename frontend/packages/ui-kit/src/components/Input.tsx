import React from 'react'
import { cn } from '../utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export const Input = ({ label, error, className, ...props }: InputProps) => (
  <div className="w-full flex flex-col gap-1.5">
    <label className="text-[11px] font-black text-text-main uppercase tracking-widest">
      {label}
    </label>
    <input
      className={cn(
        'w-full h-12 px-4 rounded-md bg-black/5 border-2 border-transparent focus:border-primary focus:bg-surface text-text-main font-bold outline-none transition-none placeholder:text-text-main/20',
        error && 'border-danger bg-danger/5',
        className,
      )}
      {...props}
    />
    {error && (
      <span className="text-[10px] font-bold text-danger uppercase tracking-tight">
        {error}
      </span>
    )}
  </div>
)
