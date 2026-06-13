import React, { useState } from 'react'
import { createRoute, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { AlertCircle, UserPlus } from 'lucide-react'
import { Button, Card } from '@resq/ui-kit'
import { authService } from '@resq/api-client'
import type { ApiError } from '@resq/types'
import { Route as rootRoute } from './__root'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/register',
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setFieldErrors({})
    setIsSubmitting(true)

    try {
      const response = await authService.register({
        phone_number: phoneNumber,
        password,
        full_name: fullName.trim(),
        email: email.trim() || undefined,
      })
      localStorage.setItem('access_token', response.access_token)
      localStorage.setItem('refresh_token', response.refresh_token)
      await queryClient.invalidateQueries({ queryKey: ['auth'] })
      navigate({ to: '/' })
    } catch (err: any) {
      const apiErr = err as ApiError
      setError(apiErr.detail || apiErr.title)
      if (apiErr.errors) {
        setFieldErrors(apiErr.errors)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-[70vh] flex-col justify-center p-4">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <section>
          <h1 className="text-2xl font-black uppercase tracking-tight">
            Create Account
          </h1>
          <p className="mt-1 text-sm font-bold text-text-muted">
            Register to access alerts and send SOS signals.
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
            <label className="text-xs font-black uppercase tracking-widest text-text-muted">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`h-12 rounded-md border bg-bg-base px-4 text-base font-bold text-text-main ${fieldErrors.full_name ? 'border-danger' : 'border-[var(--color-border)]'}`}
            />
            {fieldErrors.full_name && (
              <p className="text-[10px] font-black uppercase text-danger">
                {fieldErrors.full_name}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase tracking-widest text-text-muted">
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className={`h-12 rounded-md border bg-bg-base px-4 text-base font-bold text-text-main ${fieldErrors.phone_number ? 'border-danger' : 'border-[var(--color-border)]'}`}
            />
            {fieldErrors.phone_number && (
              <p className="text-[10px] font-black uppercase text-danger">
                {fieldErrors.phone_number}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase tracking-widest text-text-muted">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-md border border-[var(--color-border)] bg-bg-base px-4 text-base font-bold text-text-main"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase tracking-widest text-text-muted">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`h-12 rounded-md border bg-bg-base px-4 text-base font-bold text-text-main ${fieldErrors.password ? 'border-danger' : 'border-[var(--color-border)]'}`}
            />
            {fieldErrors.password && (
              <p className="text-[10px] font-black uppercase text-danger">
                {fieldErrors.password}
              </p>
            )}
          </div>
        </Card>

        <Button
          type="submit"
          size="xl"
          className="w-full"
          isLoading={isSubmitting}
        >
          <UserPlus className="mr-2 h-5 w-5" />
          Create Account
        </Button>

        <p className="text-center text-xs font-bold uppercase text-text-muted">
          Already have an account?{' '}
          <a
            href="/auth/login"
            className="text-primary underline"
            onClick={(e) => {
              e.preventDefault()
              navigate({ to: '/auth/login' })
            }}
          >
            Sign In
          </a>
        </p>
      </form>
    </main>
  )
}
