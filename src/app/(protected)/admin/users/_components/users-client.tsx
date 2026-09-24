'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DataTableUsers } from './data-table-users'
import { columns } from './columns'
import { updateUserRoles } from '../_actions/update-user-roles'
import { EditUserDialog } from './edit-user-dialog'

type User = {
  id: string
  name: string
  email: string
  isTeacher: boolean | null
  isAdmin: boolean | null
  klasse: string | null
  image: string | null
  teacherRequested: boolean
  nameBlocked: boolean
}

interface UsersClientProps {
  users: User[]
  viewerIsAdmin: boolean
}

const UsersClient = ({ users, viewerIsAdmin }: UsersClientProps) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const editing = users.find((u) => u.id === editingId) ?? null
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [userIsTeacher, setUserIsTeacher] = useState<Record<string, boolean>>(
    {},
  )

  const handleIsTeacherChange = (userId: string, value: boolean) => {
    setUserIsTeacher((prev) => ({ ...prev, [userId]: value }))
  }

  const onClick = async () => {
    try {
      setIsLoading(true)

      const updateData = Object.entries(userIsTeacher).map(
        ([userId, isTeacher]) => ({
          userId,
          isTeacher,
        }),
      )

      const result = await updateUserRoles(updateData)
      if (!result.success) return toast.error(result.error)

      toast.success('Rollen geändert')
      setUserIsTeacher({})
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  const tableData = users.map((user) => ({
    id: user.id,
    username: user.name || '',
    email: user.email,
    isTeacher: user.isTeacher ?? false,
    isAdmin: user.isAdmin === true,
    klasse: user.klasse,
    teacherRequested: user.teacherRequested,
    nameBlocked: user.nameBlocked,
  }))

  const tableColumns = columns({
    handleIsTeacherChange,
    userIsTeacher,
    onEdit: setEditingId,
    viewerIsAdmin,
  })

  return (
    <div>
      <div className="p-6 flex justify-between">
        <div />
        <Button
          onClick={onClick}
          disabled={isLoading || Object.keys(userIsTeacher).length === 0}
          variant="secondary"
          size="sm"
        >
          Rollen übernehmen
        </Button>
      </div>
      <div className="py-2 px-6">
        <DataTableUsers
          columns={tableColumns}
          data={tableData}
          handleIsTeacherChange={handleIsTeacherChange}
          userIsTeacher={userIsTeacher}
        />
      </div>
      {editing && (
        <EditUserDialog
          key={editing.id}
          user={editing}
          open
          onOpenChange={(open) => !open && setEditingId(null)}
        />
      )}
    </div>
  )
}

export default UsersClient
