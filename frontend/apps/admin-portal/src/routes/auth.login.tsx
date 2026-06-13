import React, { useState } from 'react'
import { createRoute, useNavigate } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { Button, Card, Input } from '@resq/ui-kit'
import { authService } from '@resq/api-client'
import type { ApiError } from '@resq/types'
import { ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/login',
  component: AdminLogin,
})

function AdminLogin() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const loginPromise = authService.login({ phone_number: phone, password })

    toast.promise(loginPromise, {
      loading: 'Authenticating...',
      success: 'Login successful',
      error: (err: any) => {
        const apiErr = err as ApiError
        return apiErr.detail || apiErr.title || 'Invalid credentials'
      },
    })

    try {
      const res = await loginPromise
      localStorage.setItem('access_token', res.access_token)
      localStorage.setItem('refresh_token', res.refresh_token)
      navigate({ to: '/command-center' })
    } catch (err: any) {
      const apiErr = err as ApiError
      setError(
        apiErr.detail ||
          apiErr.title ||
          'Invalid credentials or unauthorized access.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 flex flex-col gap-6 border-[var(--color-border)]">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-text-main">
            Admin Portal
          </h1>
        </div>
        {error && (
          <div className="p-3 bg-danger/10 text-danger text-xs font-black rounded-md uppercase tracking-wide text-center">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label="Admin Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button
            type="submit"
            size="xl"
            isLoading={loading}
            className="mt-2 w-full"
          >
            Sign In
          </Button>
        </form>
      </Card>
    </div>
  )
}