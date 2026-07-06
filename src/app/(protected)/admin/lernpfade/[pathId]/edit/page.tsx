import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle2,
  Pencil,
  Route,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
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
    where: { isPublished: true },
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
    <div className="mx-auto w-full max-w-6xl space-y-8 p-4 md:p-6">
      <Link
        href="/admin/lernpfade"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zu Lernpfaden
      </Link>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="space-y-3">
        <div className="flex items-center gap-2.5 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          <Route className="h-5 w-5" />
          <span>Lernpfad bearbeiten</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {path.isPublished ? (
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400"
            >
              <CheckCircle2 />
              Veröffentlicht
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-muted-foreground/30 bg-muted/40 text-[10px] text-muted-foreground"
            >
              <Pencil />
              Entwurf
            </Badge>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {path.title}
        </h1>
      </header>

      <PathMetaForm path={path} badges={badges} />

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Quest-Kette</h2>
        <p className="text-sm text-muted-foreground">
          Verbinde Quests in der Reihenfolge, in der sie absolviert werden.
        </p>
        <PathFlowEditor
          pathId={path.id}
          initialFlow={initialFlow as Parameters<typeof PathFlowEditor>[0]['initialFlow']}
          questOptions={courses.map((c) => ({ id: c.id, title: c.title }))}
        />
      </section>
    </div>
  )
}
