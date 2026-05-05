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
    cell: ({ row }) => (
      <span>{row.original.isTeacher ? 'Lehrer' : 'Schüler'}</span>
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
