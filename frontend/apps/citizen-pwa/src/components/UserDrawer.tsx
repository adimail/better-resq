import { useState } from 'react'
import { UserCircle, Bell, LogIn, LogOut, Clock, ShieldAlert } from 'lucide-react'
import { Drawer } from 'vaul'
import { Button, ThemeToggle, Badge } from '@resq/ui-kit'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'
import { useAppStore } from '../store/useAppStore'
import { AppLink } from './AppLink'

export const UserDrawer = () => {
  const [open, setOpen] = useState(false)
  const { user, isAuthenticated, isProfileLoading, logout } = useAuth()
  const { notifications, unreadCount } = useNotifications()
  const lastSyncedAt = useAppStore((state) => state.lastSyncedAt)
  const latestNotification = notifications[0]
  const lastSynced = lastSyncedAt
    ? new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(lastSyncedAt))
    : 'Not synced'

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        aria-label="Open user menu"
        className="-mr-2 shrink-0 p-2 text-text-main"
        onClick={() => setOpen(true)}
      >
        <UserCircle className="h-7 w-7" />
      </Button>

      <Drawer.Root
        open={open}
        onOpenChange={setOpen}
        direction="bottom"
        shouldScaleBackground={false}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[140] bg-black/50 backdrop-blur-sm" />

          <Drawer.Content
            className="fixed bottom-0 left-0 right-0 z-[150] rounded-t-3xl border border-[var(--color-border-strong)] bg-bg-base outline-none"
            style={{ paddingBottom: 16 }}
          >
            <Drawer.Title className="sr-only">User Menu</Drawer.Title>

            <div className="mx-auto mt-3 mb-4 h-1 w-24 rounded-full bg-text-main/20" />

            <div className="flex flex-col gap-6 p-4">
              <AppLink
                to="/profile"
                onClick={() => setOpen(false)}
                className="flex shrink-0 flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 no-underline"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black uppercase tracking-tight">
                    {isProfileLoading
                      ? 'Checking session'
                      : user?.full_name || 'Guest session'}
                  </span>

                  <Badge variant={isAuthenticated ? 'success' : 'warning'}>
                    {isAuthenticated ? 'Signed in' : 'Signed out'}
                  </Badge>
                </div>

                <span className="text-xs font-bold uppercase text-text-muted">
                  {user?.phone_number ||
                    (isAuthenticated
                      ? 'Profile unavailable'
                      : 'No active token')}
                </span>
              </AppLink>

              <div className="flex shrink-0 flex-col gap-2">
                <span className="px-2 text-[10px] font-black uppercase tracking-widest text-text-main/40">
                  Notifications
                </span>

                {latestNotification ? (
                  <AppLink
                    to="/notifications"
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 rounded-lg border border-danger/20 bg-danger/10 p-3 no-underline"
                  >
                    <Bell className="mt-0.5 h-5 w-5 shrink-0 text-danger" />

                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase text-danger">
                        {latestNotification.title}
                      </span>

                      <span className="text-[10px] font-bold text-danger/80">
                        {latestNotification.message}
                      </span>
                    </div>
                  </AppLink>
                ) : (
                  <div className="flex items-start gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
                    <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-text-muted" />

                    <span className="text-xs font-bold uppercase text-text-muted">
                      {isAuthenticated
                        ? 'No notifications received'
                        : 'Sign in to receive alerts'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex shrink-0 flex-col gap-2">
                <span className="px-2 text-[10px] font-black uppercase tracking-widest text-text-main/40">
                  System
                </span>

                <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-3">
                  <span className="text-xs font-bold uppercase">Theme</span>
                  <ThemeToggle />
                </div>

                <div className="flex items-center justify-between gap-2 p-3 text-[10px] font-bold uppercase text-text-muted">
                  <span className="flex items-center gap-2">
                    <Bell className="h-4 w-4 shrink-0" />
                    Unread alerts
                  </span>
                  <span>{unreadCount}</span>
                </div>

                <div className="flex items-center justify-between gap-2 p-3 text-[10px] font-bold uppercase text-text-muted">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0" />
                    Last synced
                  </span>
                  <span>{lastSynced}</span>
                </div>

                {isAuthenticated && (
                  <AppLink
                    to="/profile"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-3 no-underline"
                  >
                    <span className="flex items-center gap-2 text-xs font-bold uppercase">
                      <UserCircle className="h-4 w-4 shrink-0" />
                      View Profile
                    </span>
                    <span className="text-[10px] font-bold text-text-muted">&rarr;</span>
                  </AppLink>
                )}

                {isAuthenticated ? (
                  <Button
                    variant="danger"
                    className="mt-2 h-14 w-full flex items-center"
                    disabled={logout.isPending}
                    isLoading={logout.isPending}
                    onClick={() => logout.mutate()}
                  >
                    <LogOut className="mr-2 h-5 w-5 shrink-0" />
                    Sign Out
                  </Button>
                ) : (
                  <AppLink
                    to="/auth/login"
                    onClick={() => setOpen(false)}
                    className="mt-4 inline-flex h-14 min-h-[48px] w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-black uppercase tracking-widest text-white"
                  >
                    <LogIn className="mr-2 h-5 w-5 shrink-0" />
                    Sign In
                  </AppLink>
                )}
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  )
}
