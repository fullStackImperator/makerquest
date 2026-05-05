'use client'

import { DataTable } from './data-table'
import {
  createQuestColumns,
  type CoursesWithEnrolledStudentsProps,
} from './columns'

export function AdminQuestsDataTable({
  isAdmin,
  data,
}: {
  isAdmin: boolean
  data: CoursesWithEnrolledStudentsProps[]
}) {
  const columns = createQuestColumns(isAdmin)
  return <DataTable columns={columns} data={data} />
}
