'use client'

import {
  type Column,
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowUpDown, ExternalLink } from 'lucide-react'
import { createContext, useContext, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CourseProgress } from '@/components/quests/course-progress'
import type { Attachment } from '@/generated/client'
import { displayAttachmentName } from '@/lib/attachment-display'

import { awardExperiencePoints } from '../_actions/award-points'
import { revokeExperiencePoints } from '../_actions/revoke-points'

export type GradingStudentRow = {
  id: string
  courseId: string
  userId: string
  userName: string
  enrolledAt: string
  grading?: {
    id?: string
    userId?: string
    points?: number
    courseId?: string
    createdAt?: Date
    updatedAt?: Date
  } | null
  progress?: number | null
  hasReceivedPoints: boolean
  attachments: Attachment[]
}

type GradingTableContextValue = {
  courseId: string
  updatedPoints: Record<string, number>
  setUpdatedPoints: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >
  pointsAwarded: Record<string, boolean>
  setPointsAwarded: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >
}

const GradingTableContext = createContext<GradingTableContextValue | null>(
  null,
)

function useGradingTableContext() {
  const ctx = useContext(GradingTableContext)
  if (!ctx) {
    throw new Error('useGradingTableContext must be used within provider')
  }
  return ctx
}

function formatDateDe(iso: string) {
  try {
    return new Intl.DateTimeFormat('de-DE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return '—'
  }
}

function SortableHeader({
  label,
  column,
}: {
  label: string
  column: Column<GradingStudentRow, unknown>
}) {
  return (
    <Button
      variant="ghost"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {label}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  )
}

function NoteCell({ row }: { row: GradingStudentRow }) {
  const { updatedPoints, setUpdatedPoints } = useGradingTableContext()

  const handleInputChange = (userId: string, points: number) => {
    setUpdatedPoints((prev) => ({ ...prev, [userId]: points }))
  }

  return (
    <Input
      type="number"
      min={0}
      className="h-9 w-20"
      value={
        updatedPoints[row.userId] !== undefined
          ? updatedPoints[row.userId]
          : (row.grading?.points ?? '')
      }
      onChange={(e) => {
        const v = e.target.value
        if (v === '') {
          setUpdatedPoints((prev) => {
            const next = { ...prev }
            delete next[row.userId]
            return next
          })
          return
        }
        const p = parseInt(v, 10)
        if (!Number.isNaN(p)) handleInputChange(row.userId, p)
      }}
    />
  )
}

function XpCell({ row }: { row: GradingStudentRow }) {
  const { courseId, pointsAwarded, setPointsAwarded } = useGradingTableContext()

  const awardPoints = async (userId: string, userName: string) => {
    try {
      const result = await awardExperiencePoints({ userId, courseId })
      if (result.success) {
        setPointsAwarded((prev) => ({ ...prev, [userId]: true }))
        toast.success(`Experience points awarded to ${userName}`)
      } else {
        toast.error('Error: Awarding XP Points failed!')
      }
    } catch {
      toast.error('Something went wrong. Error awarding points.')
    }
  }

  const revokePoints = async (userId: string, userName: string) => {
    try {
      const result = await revokeExperiencePoints({ userId, courseId })
      if (result.success) {
        setPointsAwarded((prev) => ({ ...prev, [userId]: false }))
        toast.success(`Experience points revoked for ${userName}`)
      } else {
        toast.error('Error: Revoking XP Points failed!')
      }
    } catch {
      toast.error('Something went wrong. Error revoking points.')
    }
  }

  return pointsAwarded[row.userId] ? (
    <Button
      variant="destructive"
      onClick={() => revokePoints(row.userId, row.userName)}
    >
      Punkte zurücknehmen
    </Button>
  ) : (
    <Button
      variant="secondary"
      onClick={() => awardPoints(row.userId, row.userName)}
    >
      Punkte vergeben
    </Button>
  )
}

function buildColumns(): ColumnDef<GradingStudentRow>[] {
  return [
    {
      accessorKey: 'userName',
      header: ({ column }) => (
        <SortableHeader label="Schüler" column={column} />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.userName}</span>
      ),
    },
    {
      id: 'progress',
      accessorFn: (row) => row.progress ?? 0,
      header: ({ column }) => (
        <SortableHeader label="Fortschritt" column={column} />
      ),
      cell: ({ row }) => (
        <CourseProgress
          variant={row.original.progress === 100 ? 'success' : 'default'}
          size="sm"
          value={row.original.progress || 0}
        />
      ),
    },
    {
      id: 'attachmentCount',
      accessorFn: (row) => row.attachments.length,
      header: ({ column }) => (
        <SortableHeader label="Ergebnisse" column={column} />
      ),
      cell: ({ row }) => {
        const a = row.original.attachments
        if (a.length === 0) {
          return (
            <span className="text-muted-foreground text-sm">Keine</span>
          )
        }
        return (
          <ul className="max-w-xs space-y-1.5">
            {a.map((att) => (
              <li key={att.id}>
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex max-w-full items-center gap-1 text-sm underline-offset-4 hover:underline"
                >
                  <ExternalLink className="size-3.5 shrink-0 opacity-70" />
                  <span className="truncate">{displayAttachmentName(att)}</span>
                </a>
              </li>
            ))}
          </ul>
        )
      },
    },
    {
      id: 'enrolledAt',
      accessorFn: (row) => new Date(row.enrolledAt).getTime(),
      header: ({ column }) => (
        <SortableHeader label="Anmeldung" column={column} />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground whitespace-nowrap text-sm tabular-nums">
          {formatDateDe(row.original.enrolledAt)}
        </span>
      ),
    },
    {
      id: 'gradePoints',
      accessorFn: (row) => row.grading?.points ?? -1,
      header: ({ column }) => <SortableHeader label="Note" column={column} />,
      cell: ({ row }) => <NoteCell row={row.original} />,
    },
    {
      id: 'xp',
      enableSorting: false,
      header: () => <span className="font-medium">Punkte vergeben</span>,
      cell: ({ row }) => <XpCell row={row.original} />,
    },
  ]
}

export function GradingDataTable({
  data,
  contextValue,
}: {
  data: GradingStudentRow[]
  contextValue: GradingTableContextValue
}) {
  const columns = useMemo(() => buildColumns(), [])
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'userName', desc: false },
  ])

  const table = useReactTable({
    data,
    columns,
    filterFns: {},
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  })

  return (
    <GradingTableContext.Provider value={contextValue}>
      <div className="panel shadow-small relative z-0 flex w-full flex-col justify-between gap-4 overflow-auto rounded-lg p-4">
        <Table className="table-auto h-auto min-h-[100px] w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="align-middle">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="align-top">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground h-24 text-center"
                >
                  Keine angemeldeten Schüler.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </GradingTableContext.Provider>
  )
}
