'use client'

import { DataTable } from './data-table'
import {
  createQuestColumns,
  type CoursesWithEnrolledStudentsProps,
} from './columns'

export function AdminQuestsDataTable({
  isAdmin,
  showOwner,
  data,
}: {
  isAdmin: boolean
  showOwner: boolean
  data: CoursesWithEnrolledStudentsProps[]
}) {
  const columns = createQuestColumns({ showOwner, isAdmin })
  return <DataTable columns={columns} data={data} />
}
