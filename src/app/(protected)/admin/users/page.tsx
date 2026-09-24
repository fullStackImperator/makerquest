import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'
import { isNameBlocked } from '@/lib/name-policy'
import UsersClient from './_components/users-client'

const UsersPage = async () => {
  const viewer = await getSessionUser()
  const users = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      isTeacher: true,
      isAdmin: true,
      klasse: true,
      image: true,
      teacherRequestedAt: true,
    },
  })

  // Inappropriate names first, then open teacher requests (oldest on top).
  const flagged = users.filter((u) => isNameBlocked(u.name))
  const pending = users
    .filter((u) => !isNameBlocked(u.name) && u.teacherRequestedAt && !u.isTeacher)
    .sort((a, b) => a.teacherRequestedAt!.getTime() - b.teacherRequestedAt!.getTime())
  const rest = users.filter(
    (u) => !isNameBlocked(u.name) && !(u.teacherRequestedAt && !u.isTeacher),
  )

  return (
    <UsersClient
      viewerIsAdmin={viewer?.isAdmin === true}
      users={[...flagged, ...pending, ...rest].map(({ teacherRequestedAt, ...u }) => ({
        ...u,
        teacherRequested: !!teacherRequestedAt && !u.isTeacher,
        nameBlocked: isNameBlocked(u.name),
      }))}
    />
  )
}

export default UsersPage
