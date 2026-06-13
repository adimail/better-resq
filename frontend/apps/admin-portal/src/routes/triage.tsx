import { createRoute } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import type { IncidentReport } from '@resq/types'
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
} from '@tanstack/react-table'
import { Card, Badge, Button } from '@resq/ui-kit'
import { ChevronDown, ChevronRight, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { Fragment, useState } from 'react'
import { useAdminIncidents } from '../hooks/useAdminData'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/triage',
  component: TriagePage,
})

function TriagePage() {
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())
  const {
    data: incidents = [],
    isLoading,
    verifyMutation,
    queryClient,
  } = useAdminIncidents()

  const handleAction = async (id: string, status: string) => {
    setRemovingIds((prev) => new Set(prev).add(id))

    const promise = verifyMutation.mutateAsync({ id, status })

    toast.promise(promise, {
      loading:
        status === 'verified' ? 'Verifying report...' : 'Rejecting report...',
      success:
        status === 'verified'
          ? 'Report Verified — alerting nearby citizens'
          : 'Report Rejected',
      error: 'Failed to update report status',
    })

    try {
      await promise
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['admin-incidents'] })
        setRemovingIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }, 300)
    } catch {
      setRemovingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const columns = [
    {
      id: 'expander',
      header: () => null,
      cell: ({ row }: any) => (
        <button
          className="p-1 hover:bg-black/5 rounded cursor-pointer border-none bg-transparent"
          onClick={row.getToggleExpandedHandler()}
        >
          {row.getIsExpanded() ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Reported',
      cell: (info: any) =>
        new Date(info.getValue() || Date.now()).toLocaleString(),
    },
    {
      accessorKey: 'disaster_type',
      header: 'Type',
      cell: (info: any) => (
        <span className="uppercase font-black">
          {info.getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: (info: any) => {
        const val = (info.getValue() as string) || 'PENDING'
        return (
          <Badge
            variant={
              val === 'VERIFIED'
                ? 'success'
                : val === 'REJECTED'
                  ? 'danger'
                  : 'warning'
            }
          >
            {val}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'ai_confidence_score',
      header: 'AI Score',
      cell: (info: any) => {
        const score = (info.getValue() as number) || 0
        return `${(score * 100).toFixed(0)}%`
      },
    },
    {
      id: 'view',
      header: '',
      cell: ({ row }: any) => (
        <a
          href={`/triage/${row.original.id}`}
          onClick={(e) => {
            e.preventDefault()
            window.history.pushState(null, '', `/triage/${row.original.id}`)
            window.dispatchEvent(new PopStateEvent('popstate'))
          }}
          className="inline-flex items-center justify-center rounded bg-primary px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white"
        >
          View Details
        </a>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => {
        const id = (row.original as IncidentReport).id
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="px-2 cursor-pointer"
              onClick={() => handleAction(id, 'verified')}
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="danger"
              className="px-2 cursor-pointer"
              onClick={() => handleAction(id, 'rejected')}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  const table = useReactTable<IncidentReport>({
    data: incidents,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  })

  return (
    <div className="absolute inset-0 flex flex-col p-8 overflow-y-auto max-w-7xl mx-auto gap-6 w-full">
      <div className="shrink-0">
        <h1 className="text-3xl font-black uppercase tracking-tight text-text-main">
          Incident Triage
        </h1>
        <p className="text-sm font-bold text-text-muted mt-1 uppercase tracking-widest">
          Verify or reject citizen reports
        </p>
      </div>
      <Card className="p-0 overflow-hidden shadow-sm shrink-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr
                  key={hg.id}
                  className="bg-[var(--color-surface-muted)] border-b border-[var(--color-border)] text-xs uppercase tracking-widest text-text-muted"
                >
                  {hg.headers.map((header) => (
                    <th key={header.id} className="p-4 font-black">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="text-sm font-bold text-text-main">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="p-8 text-center uppercase"
                  >
                    Loading queue...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="p-8 text-center uppercase"
                  >
                    No pending incidents
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => {
                  const orig = row.original as IncidentReport
                  const isRemoving = removingIds.has(orig.id)
                  return (
                    <Fragment key={row.id}>
                      <tr
                        style={{
                          opacity: isRemoving ? 0.3 : 1,
                          transform: isRemoving ? 'scale(0.98)' : 'scale(1)',
                          transition: 'all 300ms ease-out',
                        }}
                        className={`border-b border-[var(--color-border)] ${
                          orig.status === 'VERIFIED'
                            ? 'bg-success/5'
                            : orig.status === 'REJECTED'
                              ? 'bg-danger/5'
                              : 'hover:bg-black/5'
                        }`}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="p-4">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </td>
                        ))}
                      </tr>
                      {row.getIsExpanded() && !isRemoving && (
                        <tr className="bg-black/5 border-b border-[var(--color-border)]">
                          <td colSpan={columns.length} className="p-6">
                            <div className="flex gap-6">
                              {orig.image_url ? (
                                <img
                                  src={orig.image_url}
                                  alt="Incident"
                                  className="w-48 h-32 object-cover rounded border border-black/10 bg-black/10"
                                />
                              ) : (
                                <div className="w-48 h-32 bg-black/10 rounded flex items-center justify-center text-xs uppercase text-text-muted">
                                  No Image
                                </div>
                              )}
                              <div className="flex-1 flex flex-col gap-2">
                                <p className="text-xs uppercase font-black text-text-muted">
                                  Description
                                </p>
                                <p className="text-sm bg-surface p-3 rounded border border-black/10">
                                  {(orig.description as string) || 'N/A'}
                                </p>
                                <p className="text-xs uppercase font-black text-text-muted mt-2">
                                  Location
                                </p>
                                <p className="text-sm">
                                  {orig.location?.lat?.toFixed(5) || '0'},{' '}
                                  {orig.location?.lng?.toFixed(5) || '0'}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}