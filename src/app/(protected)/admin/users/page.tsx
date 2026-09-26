import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/get-session-user'
import { isNameBlocked } from '@/lib/name-policy'
import { isOwner } from '@/lib/owner'
import { isApproved } from '@/lib/approval'
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
      approvedAt: true,
      _count: { select: { ownedLearningPaths: true } },
    },
  })
  // Course.userId has no relation, so count owned quests separately.
  const courseCounts = new Map(
    (await db.course.groupBy({ by: ['userId'], _count: { _all: true } })).map((c) => [
      c.userId,
      c._count._all,
    ]),
  )

  // Accounts waiting for approval first, then inappropriate names, then open
  // teacher requests (oldest on top).
  const unapproved = users.filter((u) => !isApproved(u)).reverse()
  const approved = users.filter((u) => isApproved(u))
  const flagged = approved.filter((u) => isNameBlocked(u.name))
  const pending = approved
    .filter((u) => !isNameBlocked(u.name) && u.teacherRequestedAt && !u.isTeacher)
    .sort((a, b) => a.teacherRequestedAt!.getTime() - b.teacherRequestedAt!.getTime())
  const rest = approved.filter(
    (u) => !isNameBlocked(u.name) && !(u.teacherRequestedAt && !u.isTeacher),
  )

  return (
    <UsersClient
      viewerIsAdmin={viewer?.isAdmin === true || isOwner(viewer)}
      viewerIsOwner={isOwner(viewer)}
      users={[...unapproved, ...flagged, ...pending, ...rest].map(({ teacherRequestedAt, approvedAt, _count, ...u }) => ({
        ...u,
        awaitingApproval: !isApproved({ ...u, approvedAt }),
        isOwner: isOwner(u),
        ownedCourses: courseCounts.get(u.id) ?? 0,
        ownedLearningPaths: _count.ownedLearningPaths,
        teacherRequested: !!teacherRequestedAt && !u.isTeacher,
        nameBlocked: isNameBlocked(u.name),
      }))}
    />
  )
}

export default UsersPage
