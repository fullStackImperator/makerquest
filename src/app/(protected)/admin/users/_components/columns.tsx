'use client'

import { Button } from '@/components/ui/button'
// import { cn } from '@/lib/utils'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, Pencil } from 'lucide-react'
import { Combobox } from '@/components/ui/combobox'

type UserProps = {
  id: string
  username: string
  email: string
  isTeacher?: boolean | null
  isAdmin: boolean
  klasse: string | null
  teacherRequested: boolean
  nameBlocked: boolean
}

type ColumnsProps = {
  handleIsTeacherChange: (userId: string, value: boolean) => void
  userIsTeacher: { [userId: string]: boolean }
  onEdit: (userId: string) => void
  /** Teachers may only edit students; admins may edit everyone. */
  viewerIsAdmin: boolean
}

export const columns = ({
  handleIsTeacherChange,
  userIsTeacher,
  onEdit,
  viewerIsAdmin,
}: ColumnsProps): ColumnDef<UserProps>[] => [
  {
    accessorKey: 'username',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Username
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="flex flex-wrap items-center gap-2">
        <span className={row.original.nameBlocked ? 'text-destructive font-medium' : ''}>
          {row.original.username || '—'}
        </span>
        {row.original.nameBlocked && (
          <span className="rounded-full border border-destructive/50 bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
            Unzulässiger Name
          </span>
        )}
      </span>
    ),
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Email
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: 'isTeacher',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Rolle
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) =>
      row.original.teacherRequested ? (
        <span className="inline-flex items-center rounded-full border border-amber-500/50 bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-200">
          Möchte Lehrkraft werden
        </span>
      ) : (
        <span>{row.original.isTeacher ? 'Lehrer' : 'Schüler'}</span>
      ),
  },
  {
    accessorKey: 'klasse',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Klasse
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.klasse ?? '—'}</span>
    ),
  },
  {
    header: '',
    id: 'edit',
    cell: ({ row }) => {
      const isStaff = row.original.isTeacher === true || row.original.isAdmin
      const allowed = !isStaff || viewerIsAdmin
      return (
        <Button
          variant={row.original.nameBlocked ? 'destructive' : 'ghost'}
          size="sm"
          className="gap-1.5"
          disabled={!allowed}
          title={allowed ? 'Name und Klasse bearbeiten' : 'Nur Admins können Lehrkräfte bearbeiten'}
          onClick={() => onEdit(row.original.id)}
        >
          <Pencil className="size-3.5" />
          Bearbeiten
        </Button>
      )
    },
  },
  {
    header: 'Rolle ändern',
    id: 'actions',
    cell: ({ row }) => {
      const { id } = row.original
      return (
        <Combobox
          options={[
            { label: 'Zum Lehrer ernennen', value: 'true' },
            { label: 'Zum Schüler ernennen', value: 'false' },
          ]}
          value={
            userIsTeacher[id] !== undefined ? userIsTeacher[id].toString() : ''
          }
          onChange={(value) => handleIsTeacherChange(id, value === 'true')}
        />
      )
    },
  },
]
