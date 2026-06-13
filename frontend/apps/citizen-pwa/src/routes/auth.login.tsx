import React, { useState } from 'react'
import { createRoute, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { AlertCircle, LogIn } from 'lucide-react'
import { Button, Card } from '@resq/ui-kit'
import { authService } from '@resq/api-client'
import type { ApiError } from '@resq/types'
import { Route as rootRoute } from './__root'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/login',
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!phoneNumber || !password) {
      setError('Please enter your credentials.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await authService.login({
        phone_number: phoneNumber,
        password,
      })
      localStorage.setItem('access_token', response.access_token)
      localStorage.setItem('refresh_token', response.refresh_token)
      await queryClient.invalidateQueries({ queryKey: ['auth'] })
      navigate({ to: '/' })
    } catch (err: any) {
      const apiErr = err as ApiError
      setError(apiErr.detail || apiErr.title || 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-[70vh] flex-col justify-center p-4">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <section>
          <h1 className="text-2xl font-black uppercase tracking-tight">
            Sign In
          </h1>
          <p className="mt-1 text-sm font-bold text-text-muted">
            Access emergency alerts and responder updates.
          </p>
        </section>

        {error && (
          <Card className="flex items-start gap-2 border-danger bg-danger/10">
            <AlertCircle
              className="mt-0.5 h-5 w-5 shrink-0 text-danger"
              aria-hidden="true"
            />
            <p className="text-xs font-black uppercase text-danger leading-tight">
              {error}
            </p>
          </Card>
        )}

        <Card className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="phone-number"
              className="text-xs font-black uppercase tracking-widest text-text-muted"
            >
              Phone Number
            </label>
            <input
              id="phone-number"
              type="tel"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              className="h-12 rounded-md border border-[var(--color-border)] bg-bg-base px-4 text-base font-bold text-text-main"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              className="text-xs font-black uppercase tracking-widest text-text-muted"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 rounded-md border border-[var(--color-border)] bg-bg-base px-4 text-base font-bold text-text-main"
            />
          </div>
        </Card>

        <Button
          type="submit"
          size="xl"
          className="w-full"
          isLoading={isSubmitting}
        >
          <LogIn className="mr-2 h-5 w-5" />
          Sign In
        </Button>

        <p className="text-center text-xs font-bold uppercase text-text-muted">
          Don&apos;t have an account?{' '}
          <a
            href="/auth/register"
            className="text-primary underline"
            onClick={(e) => {
              e.preventDefault()
              navigate({ to: '/auth/register' })
            }}
          >
            Create Account
          </a>
        </p>
      </form>
    </main>
  )
}
