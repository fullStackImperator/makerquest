'use client'

import { Button } from '@/components/ui/button'
// import { cn } from '@/lib/utils'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Combobox } from '@/components/ui/combobox'

type UserProps = {
  id: string
  username: string
  email: string
  isTeacher?: boolean | null
  klasse: string | null
  teacherRequested: boolean
}

type ColumnsProps = {
  handleIsTeacherChange: (userId: string, value: boolean) => void
  userIsTeacher: { [userId: string]: boolean }
}

export const columns = ({
  handleIsTeacherChange,
  userIsTeacher,
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
