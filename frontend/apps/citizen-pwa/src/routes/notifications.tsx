import { createRoute } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { Button, Card, Skeleton } from '@resq/ui-kit'
import { Bell, Check, ShieldAlert } from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/notifications',
  component: NotificationsPage,
})

function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    isError,
    isAuthenticated,
    markRead,
  } = useNotifications()

  const formatNotificationDate = (dateString: string) => {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return 'Recent'
    }
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date)
  }

  const columns = [
    {
      accessorKey: 'created_at',
      header: 'Time',
      cell: (info: any) => (
        <span className="text-[10px] uppercase font-black text-text-muted whitespace-nowrap">
          {formatNotificationDate(info.getValue())}
        </span>
      ),
    },
    {
      accessorFn: (row: any) => row,
      id: 'details',
      header: 'Alert Details',
      cell: (info: any) => {
        const notif = info.getValue()
        return (
          <div className="flex flex-col gap-1 min-w-[200px]">
            <span
              className={`text-xs font-black uppercase ${notif.severity === 'danger' ? 'text-danger' : notif.severity === 'success' ? 'text-success' : 'text-text-main'}`}
            >
              {notif.title}
            </span>
            <span className="text-sm font-bold text-text-main">
              {notif.message}
            </span>
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: 'Status',
      cell: ({ row }: any) => {
        const notif = row.original
        if (notif.read_at) {
          return (
            <span className="px-2 w-10 h-10 min-h-[40px] min-w-[40px] flex items-center justify-center text-text-muted">
              <Check className="h-4 w-4" />
            </span>
          )
        }
        return (
          <Button
            aria-label="Mark as read"
            variant="primary"
            size="sm"
            className="px-2 w-10 h-10 min-h-[40px] min-w-[40px] rounded-full shadow-lg"
            disabled={markRead.isPending}
            onClick={() => markRead.mutate(notif.id)}
          >
            <Check className="h-5 w-5" />
          </Button>
        )
      },
    },
  ]

  const table = useReactTable({
    data: notifications,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <main className="p-4 flex flex-col gap-4">
      <section className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">
            Notifications
          </h1>
          <p className="mt-1 text-sm font-bold text-text-muted">
            {unreadCount} unread alert{unreadCount === 1 ? '' : 's'}
          </p>
        </div>
        <div className="relative">
          <Bell className="h-8 w-8 text-primary" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-danger rounded-full animate-pulse border-2 border-surface" />
          )}
        </div>
      </section>

      {!isAuthenticated && (
        <Card className="border-warning bg-warning/10">
          <p className="text-sm font-black uppercase text-warning">
            Sign in to receive emergency notifications.
          </p>
        </Card>
      )}

      {isLoading && (
        <div className="flex flex-col gap-3" aria-label="Loading notifications">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      )}

      {isError && (
        <Card className="border-danger bg-danger/10">
          <p className="text-sm font-black uppercase text-danger">
            Notifications could not be loaded.
          </p>
        </Card>
      )}

      {notifications.length === 0 && !isLoading && !isError && (
        <Card className="flex items-center gap-3">
          <ShieldAlert className="h-6 w-6 text-success" />
          <p className="text-sm font-black uppercase text-text-main">
            No notifications received.
          </p>
        </Card>
      )}

      {notifications.length > 0 && (
        <Card className="p-0 overflow-hidden shadow-sm border-[var(--color-border)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr
                    key={hg.id}
                    className="bg-[var(--color-surface-muted)] border-b border-[var(--color-border)] text-[10px] uppercase tracking-widest text-text-muted"
                  >
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        className="p-3 font-black whitespace-nowrap"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => {
                  const isRead = Boolean(row.original.read_at)
                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-[var(--color-border)] last:border-none transition-colors ${
                        isRead
                          ? 'bg-surface opacity-60'
                          : 'bg-danger/5 hover:bg-danger/10'
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="p-3 align-top">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </main>
  )
}