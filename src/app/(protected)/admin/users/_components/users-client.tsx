'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DataTableUsers } from './data-table-users'
import { columns } from './columns'
import { updateUserRoles } from '../_actions/update-user-roles'

type User = {
  id: string
  name: string
  email: string
  isTeacher: boolean | null
}

interface UsersClientProps {
  users: User[]
}

const UsersClient = ({ users }: UsersClientProps) => {
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
  }))

  const tableColumns = columns({ handleIsTeacherChange, userIsTeacher })

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
    </div>
  )
}

export default UsersClient
