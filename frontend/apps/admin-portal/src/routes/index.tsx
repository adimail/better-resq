import { createRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Route as rootRoute } from './__root'
import { Card, Badge, Skeleton } from '@resq/ui-kit'
import { authService } from '@resq/api-client'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: UsersDashboard,
})

function UsersDashboard() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: authService.listUsers,
  })

  return (
    <div className="absolute inset-0 flex flex-col p-8 overflow-y-auto max-w-7xl mx-auto gap-6 w-full">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-text-main">
          User Directory
        </h1>
      </div>
      <Card className="p-0 overflow-hidden border-[var(--color-border)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-surface-muted)] border-b border-[var(--color-border)] text-xs uppercase tracking-widest text-text-muted">
                <th className="p-4 font-black">Name</th>
                <th className="p-4 font-black">Phone Number</th>
                <th className="p-4 font-black">Role</th>
                <th className="p-4 font-black">Joined</th>
              </tr>
            </thead>
            <tbody className="text-sm font-bold text-text-main">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-4">
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </td>
                </tr>
              ) : (
                users?.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-black/5"
                  >
                    <td className="p-4">{user.full_name}</td>
                    <td className="p-4">{user.phone_number}</td>
                    <td className="p-4">
                      <Badge
                        variant={
                          user.role === 'AUTHORITY'
                            ? 'danger'
                            : user.role === 'RESPONDER'
                              ? 'warning'
                              : 'neutral'
                        }
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {new Date(user.created_at!).toLocaleDateString(
                        undefined,
                        { year: 'numeric', month: 'short', day: 'numeric' },
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
