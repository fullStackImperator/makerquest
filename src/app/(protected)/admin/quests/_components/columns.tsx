'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, MoreHorizontal, Pencil } from 'lucide-react'
import Link from 'next/link'

export type CoursesWithEnrolledStudentsProps = {
  id: string
  title: string
  enrolledStudents: number
  isPublished: boolean
  ownerLabel?: string
}

export function createQuestColumns(
  showOwner: boolean,
): ColumnDef<CoursesWithEnrolledStudentsProps>[] {
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
      const { id } = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-4 w-8 p-0">
              <span className="sr-only">Menü öffnen</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <Link href={`/admin/quests/${id}`}>
              <DropdownMenuItem>
                <Pencil className="h-4 w-4 mr-2" />
                Inhalt bearbeiten
              </DropdownMenuItem>
            </Link>
            <Link href={`/admin/quests/${id}/grading`}>
              <DropdownMenuItem>
                <Pencil className="h-4 w-4 mr-2" />
                Punkte vergeben
              </DropdownMenuItem>
            </Link>
            <Link href={`/admin/quests/${id}/badges`}>
              <DropdownMenuItem>
                <Pencil className="h-4 w-4 mr-2" />
                Badges vergeben
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
  ]

  return showOwner
    ? [titleColumn, ownerColumn, ...rest]
    : [titleColumn, ...rest]
}
