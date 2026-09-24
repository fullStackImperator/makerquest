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
      klasse: true,
      teacherRequestedAt: true,
    },
  })

  // Open teacher requests first, oldest request on top.
  const pending = users
    .filter((u) => u.teacherRequestedAt && !u.isTeacher)
    .sort((a, b) => a.teacherRequestedAt!.getTime() - b.teacherRequestedAt!.getTime())
  const rest = users.filter((u) => !(u.teacherRequestedAt && !u.isTeacher))

  return (
    <UsersClient
      users={[...pending, ...rest].map((u) => ({
        ...u,
        teacherRequested: !!u.teacherRequestedAt && !u.isTeacher,
      }))}
    />
  )
}

export default UsersPage
