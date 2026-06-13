import { Megaphone, ShieldAlert, Navigation } from 'lucide-react'
import { Card, Skeleton } from '@resq/ui-kit'
import { useNotifications } from '../../../hooks/useNotifications'

export const NoticeBoard = () => {
  const { notifications, isLoading } = useNotifications()
  const displayNotices = notifications.slice(0, 3)

  const staticNotices = [
    {
      id: '1',
      title: 'Road Closures',
      message: 'Main street bridge is impassable. Use highway alternative.',
      icon: ShieldAlert,
      color: 'text-warning',
    },
    {
      id: '2',
      title: 'Stay Prepared',
      message: 'Keep emergency kits ready and devices fully charged.',
      icon: Megaphone,
      color: 'text-primary',
    },
    {
      id: '3',
      title: 'Find Safe Zones',
      message: 'Three new medical camps deployed in the north district.',
      icon: Navigation,
      color: 'text-success',
    },
  ]

  return (
    <div className="flex flex-col gap-3 px-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-tight text-text-muted">
          Public Notice Board
        </h2>
      </div>

      <div className="flex flex-col gap-2">
        {displayNotices.length > 0 ? (
          displayNotices.map((notice) => (
            <Card key={notice.id} className="p-3 flex items-start gap-3">
              <div className="bg-danger/10 p-2 rounded-lg shrink-0">
                <ShieldAlert className="w-5 h-5 text-danger" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-text-main">
                  {notice.title}
                </h4>
                <p className="text-[11px] font-bold text-text-muted mt-0.5 line-clamp-2">
                  {notice.message}
                </p>
              </div>
            </Card>
          ))
        ) : isLoading ? (
          <>
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </>
        ) : (
          staticNotices.map((notice) => (
            <Card
              key={notice.id}
              className="p-3 flex items-start gap-3 border-[var(--color-border)] shadow-none"
            >
              <div
                className={`${notice.color.replace('text-', 'bg-')}/10 p-2 rounded-lg shrink-0`}
              >
                <notice.icon className={`w-5 h-5 ${notice.color}`} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-text-main">
                  {notice.title}
                </h4>
                <p className="text-[11px] font-bold text-text-muted mt-0.5">
                  {notice.message}
                </p>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
