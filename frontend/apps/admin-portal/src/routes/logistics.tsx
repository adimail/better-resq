import { createRoute, Link } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table'
import { Card } from '@resq/ui-kit'
import { toast } from 'sonner'
import { useAdminCamps } from '../hooks/useAdminData'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/logistics',
  component: LogisticsPage,
})

function LogisticsPage() {
  const { data: camps = [], isLoading, updateStockMutation } = useAdminCamps()

  const columns = [
    {
      accessorKey: 'name',
      header: 'Camp Name',
      cell: (info: any) => (
        <span className="font-black">{info.getValue()}</span>
      ),
    },
    {
      accessorKey: 'camp_type',
      header: 'Type',
      cell: (info: any) => (
        <span className="uppercase font-bold tracking-widest text-xs">
          {info.getValue()}
        </span>
      ),
    },
    {
      accessorKey: 'location',
      header: 'Coordinates',
      cell: (info: any) => {
        const loc = info.getValue()
        return `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`
      },
    },
    {
      id: 'view',
      header: '',
      cell: ({ row }: any) => (
        <Link
          to="/logistics/$id"
          params={{ id: row.original.id }}
          className="inline-flex items-center justify-center rounded bg-primary px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white no-underline hover:brightness-110"
        >
          View Details
        </Link>
      ),
    },
    {
      accessorKey: 'stock_status',
      header: 'Stock Status',
      cell: ({ row, getValue }: any) => {
        const status = getValue()
        return (
          <select
            className={`text-xs font-black uppercase tracking-widest p-2 rounded outline-none border-2 border-transparent focus:border-primary cursor-pointer ${
              status === 'critical'
                ? 'bg-danger text-white'
                : status === 'empty'
                  ? 'bg-warning text-white'
                  : status === 'low'
                    ? 'bg-orange-400 text-white'
                    : 'bg-success text-white'
            }`}
            value={status}
            onChange={(e) => {
              const promise = updateStockMutation.mutateAsync({
                id: row.original.id,
                status: e.target.value,
              })
              toast.promise(promise, {
                loading: 'Updating stock status...',
                success: 'Camp stock updated successfully',
                error: 'Failed to update stock status',
              })
            }}
          >
            <option value="fully_stocked">Fully Stocked</option>
            <option value="low">Low</option>
            <option value="empty">Empty</option>
            <option value="critical">Critical</option>
          </select>
        )
      },
    },
  ]

  const table = useReactTable({
    data: camps,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="absolute inset-0 flex flex-col p-8 overflow-y-auto max-w-7xl mx-auto gap-6 w-full">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-text-main">
            Logistics & Camps
          </h1>
          <p className="text-sm font-bold text-text-muted mt-1 uppercase tracking-widest">
            Manage resources and deployment
          </p>
        </div>
        <Link
          to="/logistics/new"
          className="flex min-h-[48px] items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-black uppercase tracking-widest text-white shadow-md hover:brightness-110 no-underline"
        >
          Deploy New Camp
        </Link>
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
                    Loading logistics...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="p-8 text-center uppercase text-text-muted"
                  >
                    No camps deployed yet.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[var(--color-border)] hover:bg-black/5"
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}