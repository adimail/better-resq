import { createRoute } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import type { SosSignal, SosStatus } from '@resq/types'
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
} from '@tanstack/react-table'
import { Card, Badge, Button } from '@resq/ui-kit'
import {
  ChevronDown,
  ChevronRight,
  UserCheck,
  CheckCircle2,
  Battery,
  MessageSquare,
} from 'lucide-react'
import { toast } from 'sonner'
import { Fragment, useState } from 'react'
import { useAdminSOS } from '../hooks/useAdminData'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sos',
  component: SosPage,
})

function SosPage() {
  const [statusFilter, setStatusFilter] = useState('active')
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const {
    data: response,
    isLoading,
    updateMutation,
  } = useAdminSOS(statusFilter)

  const signals = response?.data || []

  const handleAction = async (id: string, status: string) => {
    setProcessingIds((prev) => new Set(prev).add(id))

    const promise = updateMutation.mutateAsync({ id, status })

    toast.promise(promise, {
      loading: 'Updating SOS status...',
      success: `SOS marked as ${status}`,
      error: 'Failed to update SOS status',
    })

    try {
      await promise
      setProcessingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    } catch {
      setProcessingIds((prev) => {
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
      accessorKey: 'id',
      header: 'Signal ID',
      cell: (info: any) => (
        <span className="font-mono text-[10px] uppercase text-text-muted">
          {String(info.getValue()).split('-')[0]}
        </span>
      ),
    },
    {
      accessorKey: 'location',
      header: 'Coordinates',
      cell: (info: any) => {
        const loc = info.getValue()
        return `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`
      },
    },
    {
      accessorKey: 'battery_level',
      header: 'Battery',
      cell: (info: any) => (
        <div className="flex items-center gap-1 text-xs font-black">
          <Battery
            className={`w-4 h-4 ${info.getValue() < 20 ? 'text-danger' : 'text-success'}`}
          />
          {info.getValue()}%
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: (info: any) => {
        const val = String(info.getValue()).toUpperCase() as SosStatus
        return (
          <Badge
            variant={
              val === 'ACTIVE'
                ? 'danger'
                : val === 'ACKNOWLEDGED'
                  ? 'warning'
                  : 'success'
            }
          >
            {val}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => {
        const orig = row.original as SosSignal
        const isProcessing = processingIds.has(orig.id)
        const status = String(orig.status).toUpperCase() as SosStatus

        return (
          <div className="flex items-center gap-2">
            {status === 'ACTIVE' && (
              <Button
                size="sm"
                variant="secondary"
                disabled={isProcessing}
                onClick={() => handleAction(orig.id, 'acknowledged')}
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Acknowledge
              </Button>
            )}
            {(status === 'ACTIVE' || status === 'ACKNOWLEDGED') && (
              <Button
                size="sm"
                variant="primary"
                className="bg-success text-white"
                disabled={isProcessing}
                onClick={() => handleAction(orig.id, 'resolved')}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Resolve
              </Button>
            )}
            {status === 'RESOLVED' && (
              <span className="text-xs font-bold text-text-muted uppercase tracking-widest">
                Case Closed
              </span>
            )}
          </div>
        )
      },
    },
  ]

  const table = useReactTable<SosSignal>({
    data: signals,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  })

  return (
    <div className="absolute inset-0 flex flex-col p-8 overflow-y-auto max-w-7xl mx-auto gap-6 w-full">
      <div className="shrink-0 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-text-main">
            SOS Signals
          </h1>
          <p className="text-sm font-bold text-text-muted mt-1 uppercase tracking-widest">
            Dispatch and coordinate emergency rescues
          </p>
        </div>
        <div className="flex bg-[var(--color-surface-muted)] p-1 rounded-lg border border-[var(--color-border)]">
          {['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'].map((s) => {
            const val = s.toLowerCase()
            return (
              <button
                key={val}
                onClick={() => setStatusFilter(val)}
                className={`px-4 py-2 rounded text-xs font-black uppercase tracking-widest transition-colors ${
                  statusFilter === val
                    ? 'bg-surface shadow text-primary'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                {val}
              </button>
            )
          })}
        </div>
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
                    Loading SOS signals...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="p-8 text-center uppercase text-text-muted"
                  >
                    No signals found for this status.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => {
                  const orig = row.original as SosSignal
                  const isProcessing = processingIds.has(orig.id)
                  const status = String(orig.status).toUpperCase() as SosStatus
                  return (
                    <Fragment key={row.id}>
                      <tr
                        style={{
                          opacity: isProcessing ? 0.5 : 1,
                          transition: 'all 300ms ease-out',
                        }}
                        className={`border-b border-[var(--color-border)] ${
                          status === 'ACTIVE'
                            ? 'bg-danger/5 hover:bg-danger/10'
                            : status === 'ACKNOWLEDGED'
                              ? 'bg-warning/5 hover:bg-warning/10'
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
                      {row.getIsExpanded() && !isProcessing && (
                        <tr className="bg-black/5 border-b border-[var(--color-border)]">
                          <td colSpan={columns.length} className="p-6">
                            <div className="flex gap-6">
                              <div className="flex-1 flex flex-col gap-4">
                                <div>
                                  <p className="text-[10px] uppercase font-black text-text-muted flex items-center gap-1 mb-1">
                                    <MessageSquare className="w-3 h-3" /> User Message
                                  </p>
                                  <p className="text-sm bg-surface p-4 rounded-lg border border-[var(--color-border)]">
                                    {orig.message || 'No additional message provided by user.'}
                                  </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-surface p-3 rounded border border-[var(--color-border)]">
                                    <p className="text-[10px] uppercase font-black text-text-muted">
                                      Citizen ID
                                    </p>
                                    <p className="font-mono text-xs mt-1">
                                      {orig.citizen_id}
                                    </p>
                                  </div>
                                  <div className="bg-surface p-3 rounded border border-[var(--color-border)]">
                                    <p className="text-[10px] uppercase font-black text-text-muted">
                                      Assigned Responder
                                    </p>
                                    <p className="font-mono text-xs mt-1">
                                      {orig.responder_id || 'Unassigned'}
                                    </p>
                                  </div>
                                </div>
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