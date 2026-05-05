import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { PathFlowEditor } from '../../_components/path-flow-editor'
import { PathMetaForm } from '../../_components/path-meta-form'
import { getSessionUser } from '@/lib/get-session-user'
import { db } from '@/lib/db'

interface Props {
  params: Promise<{ pathId: string }>
}

export default async function EditLearningPathPage({ params }: Props) {
  const { pathId } = await params
  const user = await getSessionUser()
  if (!user) redirect('/')
  if (!user.isTeacher && !user.isAdmin) redirect('/')

  const path = await db.learningPath.findUnique({
    where: { id: pathId },
    include: {
      steps: {
        orderBy: { position: 'asc' },
        include: { course: { select: { id: true, title: true } } },
      },
    },
  })

  if (!path) notFound()
  if (user.id !== path.ownerId && !user.isAdmin) redirect('/admin/lernpfade')

  const courses = await db.course.findMany({
    where: {
      isPublished: true,
      ...(user.isAdmin ? {} : { userId: user.id }),
    },
    select: { id: true, title: true },
    orderBy: { title: 'asc' },
  })

  const badges = await db.badge.findMany({ orderBy: { name: 'asc' } })

  const flowData = path.flowData as {
    nodes?: { id: string; position: { x: number; y: number }; data: unknown }[]
    edges?: { id: string; source: string; target: string }[]
  }

  let initialFlow = {
    nodes: Array.isArray(flowData?.nodes) ? flowData.nodes : [],
    edges: Array.isArray(flowData?.edges) ? flowData.edges : [],
  }

  if (
    initialFlow.nodes.length === 0 &&
    path.steps.length > 0
  ) {
    const nodes = path.steps.map((s, i) => ({
      id: `n-${s.id}`,
      type: 'quest' as const,
      position: { x: 80, y: 40 + i * 140 },
      data: {
        courseId: s.courseId,
        title: s.course.title,
        bonusXp: s.bonusXp,
      },
    }))
    const edges = path.steps.slice(0, -1).map((s, i) => ({
      id: `e-${s.id}-${path.steps[i + 1].id}`,
      source: `n-${s.id}`,
      target: `n-${path.steps[i + 1].id}`,
    }))
    initialFlow = { nodes, edges }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <Link
        href="/admin/lernpfade"
        className="text-muted-foreground text-sm hover:underline"
      >
        ← Zurück
      </Link>
      <h1 className="text-2xl font-semibold">{path.title}</h1>

      <PathMetaForm path={path} badges={badges} />

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Quest-Kette</h2>
        <PathFlowEditor
          pathId={path.id}
          initialFlow={initialFlow as Parameters<typeof PathFlowEditor>[0]['initialFlow']}
          questOptions={courses.map((c) => ({ id: c.id, title: c.title }))}
        />
      </section>
    </div>
  )
}
