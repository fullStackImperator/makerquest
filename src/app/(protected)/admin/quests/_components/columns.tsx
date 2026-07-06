'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { QuestActionsCell } from './quest-actions-cell'

export type CoursesWithEnrolledStudentsProps = {
  id: string
  title: string
  enrolledStudents: number
  isPublished: boolean
  isOwner?: boolean
  ownerLabel?: string
}

export function createQuestColumns({
  showOwner,
  isAdmin,
}: {
  showOwner: boolean
  isAdmin: boolean
}): ColumnDef<CoursesWithEnrolledStudentsProps>[] {
  const titleColumn: ColumnDef<CoursesWithEnrolledStudentsProps> = {
    accessorKey: 'title',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Titel
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  }

  const ownerColumn: ColumnDef<CoursesWithEnrolledStudentsProps> = {
    accessorKey: 'ownerLabel',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Autor
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <span className="text-muted-foreground max-w-[200px] truncate text-sm">
        {row.original.ownerLabel ?? '—'}
      </span>
    ),
  }

  const rest: ColumnDef<CoursesWithEnrolledStudentsProps>[] = [
    {
    accessorKey: 'enrolledStudents',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          # Schüler
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: 'isPublished',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Kurs Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const isPublished = row.getValue('isPublished') || false

      return (
        <Badge className={cn('bg-slate-500', isPublished && 'bg-sky-700')}>
          {isPublished ? 'Published' : 'Draft'}
        </Badge>
      )
    },
  },
  {
    header: 'Bearbeiten / Bewerten',
    id: 'actions',
    cell: ({ row }) => {
      const { id, title, isOwner } = row.original

      return (
        <QuestActionsCell
          id={id}
          title={title}
          canManageShares={isAdmin || isOwner === true}
        />
      )
    },
  },
  ]

  return showOwner
    ? [titleColumn, ownerColumn, ...rest]
    : [titleColumn, ...rest]
}
