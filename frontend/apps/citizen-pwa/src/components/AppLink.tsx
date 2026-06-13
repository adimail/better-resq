import { useState } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { cn } from '@resq/ui-kit'
import type { MouseEvent, ReactNode } from 'react'

type AppLinkRenderProps = {
  isActive: boolean
  isPressed: boolean
}

interface AppLinkProps {
  to?: string
  href?: string
  children: ReactNode | ((props: AppLinkRenderProps) => ReactNode)
  className?: string | ((props: AppLinkRenderProps) => string)
  activeOptions?: { exact?: boolean }
  ariaLabel?: string
  onClick?: () => void
}

const PRESS_DELAY_MS = 120

export const AppLink = ({
  to,
  href,
  children,
  className,
  activeOptions,
  ariaLabel,
  onClick,
}: AppLinkProps) => {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const [isPressed, setIsPressed] = useState(false)
  const target = to ?? href ?? '#'
  const isActive = to
    ? activeOptions?.exact === false
      ? pathname.startsWith(to)
      : pathname === to
    : false
  const resolvedClassName =
    typeof className === 'function' ? className({ isActive, isPressed }) : className

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

    onClick?.()
    setIsPressed(true)

    if (!to) {
      window.setTimeout(() => setIsPressed(false), PRESS_DELAY_MS)
      return
    }

    event.preventDefault()
    window.setTimeout(() => {
      setIsPressed(false)
      navigate({ to: to as never })
    }, PRESS_DELAY_MS)
  }

  return (
    <a
      href={target}
      aria-label={ariaLabel}
      aria-current={isActive ? 'page' : undefined}
      data-pressed={isPressed ? 'true' : undefined}
      className={cn('pressable no-underline', resolvedClassName)}
      onClick={handleClick}
    >
      {typeof children === 'function' ? children({ isActive, isPressed }) : children}
    </a>
  )
}
