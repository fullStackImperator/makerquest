import { db } from '@/lib/db'
import UsersClient from './_components/users-client'

const UsersPage = async () => {
  const users = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      isTeacher: true,
    },
  })

  return <UsersClient users={users} />
}

export default UsersPage
