'use client'

import { Course } from '@/generated/client'
import { ColumnDef } from '@tanstack/react-table'

export const columnsScore: ColumnDef<Course>[] = [
  {
    accessorKey: 'rang',
    header: "Rang"
  },
  {
    accessorKey: 'maker',
    header: "Maker"
  },
  {
    accessorKey: 'punkte',
    header: "Punkte"
  },
]
