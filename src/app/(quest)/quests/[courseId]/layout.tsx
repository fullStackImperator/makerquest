import { auth } from '@/lib/auth'
import { getLearningPathQuestBlockRedirect } from '@/lib/learning-path-quest-access'
import { db } from '@/lib/db'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function CourseLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user?.id) {
    const u = await db.user.findUnique({
      where: { id: session.user.id },
      select: { slug: true },
    })
    const block = await getLearningPathQuestBlockRedirect(
      session.user.id,
      u?.slug ?? null,
      courseId,
    )
    if (block) redirect(block)
  }

  return <div className="flex min-h-0 flex-1 flex-col">{children}</div>
}
