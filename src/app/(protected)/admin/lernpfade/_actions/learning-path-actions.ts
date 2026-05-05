'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { headers } from 'next/headers'
import type { LernpfadDifficulty } from '@/generated/enums'

async function requireTeacherOrAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) return null
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, isTeacher: true, isAdmin: true },
  })
  if (!user || (!user.isTeacher && !user.isAdmin)) return null
  return user
}

function canEditPath(ownerId: string, user: { id: string; isAdmin: boolean | null }) {
  return user.id === ownerId || user.isAdmin === true
}

export async function createLearningPath(payload: {
  title: string
  description?: string
  difficulty: LernpfadDifficulty
  slug: string
  badgeId?: string | null
}) {
  const user = await requireTeacherOrAdmin()
  if (!user) return { success: false as const, error: 'Unauthorized' }

  try {
    const path = await db.learningPath.create({
      data: {
        title: payload.title.trim(),
        description: payload.description?.trim() || null,
        difficulty: payload.difficulty,
        slug: payload.slug.trim().toLowerCase(),
        ownerId: user.id,
        badgeId: payload.badgeId || null,
        flowData: { nodes: [], edges: [] },
        isPublished: false,
      },
    })
    return { success: true as const, id: path.id }
  } catch (e) {
    console.error('[createLearningPath]', e)
    return { success: false as const, error: 'Slug vergeben oder ungültige Daten' }
  }
}

export async function updateLearningPathMeta(
  pathId: string,
  payload: {
    title?: string
    description?: string | null
    difficulty?: LernpfadDifficulty
    badgeId?: string | null
    isPublished?: boolean
  },
) {
  const user = await requireTeacherOrAdmin()
  if (!user) return { success: false as const, error: 'Unauthorized' }

  const path = await db.learningPath.findUnique({ where: { id: pathId } })
  if (!path || !canEditPath(path.ownerId, user)) {
    return { success: false as const, error: 'Nicht gefunden' }
  }

  await db.learningPath.update({
    where: { id: pathId },
    data: {
      ...(payload.title !== undefined && { title: payload.title.trim() }),
      ...(payload.description !== undefined && {
        description: payload.description,
      }),
      ...(payload.difficulty !== undefined && { difficulty: payload.difficulty }),
      ...(payload.badgeId !== undefined && { badgeId: payload.badgeId }),
      ...(payload.isPublished !== undefined && { isPublished: payload.isPublished }),
    },
  })
  return { success: true as const }
}

export type FlowNodeData = {
  courseId: string
  title: string
  bonusXp: number
}

export type FlowPayload = {
  nodes: { id: string; position: { x: number; y: number }; data: FlowNodeData }[]
  edges: { id: string; source: string; target: string }[]
  viewport?: { x: number; y: number; zoom: number }
}

/** One edge per ordered pair (source → target); drops duplicate UI edges. */
function dedupeFlowEdges(
  edges: FlowPayload['edges'],
): FlowPayload['edges'] {
  const seen = new Set<string>()
  const out: FlowPayload['edges'] = []
  for (const e of edges) {
    const key = `${e.source}\t${e.target}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(e)
  }
  return out
}

function deriveLinearSteps(flow: FlowPayload): {
  courseId: string
  bonusXp: number
  position: number
}[] {
  const { nodes } = flow
  const edges = dedupeFlowEdges(flow.edges)
  if (nodes.length === 0) return []

  const incoming = new Map<string, number>()
  for (const e of edges) {
    incoming.set(e.target, (incoming.get(e.target) ?? 0) + 1)
  }

  const starts = nodes.filter((n) => (incoming.get(n.id) ?? 0) === 0)
  if (starts.length !== 1) {
    throw new Error('Genau ein Start-Knoten erforderlich (keine eingehende Kante).')
  }

  let currentId: string | null = starts[0].id
  const order: string[] = []
  const visited = new Set<string>()

  while (currentId) {
    if (visited.has(currentId)) throw new Error('Zyklus erkannt.')
    visited.add(currentId)
    order.push(currentId)
    const outs = edges.filter((e) => e.source === currentId)
    if (outs.length > 1)
      throw new Error('Verzweigungen sind in v1 nicht erlaubt.')
    if (outs.length === 0) break
    currentId = outs[0].target
  }

  if (visited.size !== nodes.length) {
    throw new Error('Alle Knoten müssen in einer Kette verbunden sein.')
  }

  return order.map((nodeId, position) => {
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) throw new Error('Knoten fehlt')
    const courseId = node.data.courseId
    const bonusXp = Math.max(0, Math.floor(node.data.bonusXp ?? 0))
    return { courseId, bonusXp, position }
  })
}

export async function saveLearningPathFlow(pathId: string, flow: FlowPayload) {
  const user = await requireTeacherOrAdmin()
  if (!user) return { success: false as const, error: 'Unauthorized' }

  const path = await db.learningPath.findUnique({ where: { id: pathId } })
  if (!path || !canEditPath(path.ownerId, user)) {
    return { success: false as const, error: 'Nicht gefunden' }
  }

  let steps: ReturnType<typeof deriveLinearSteps>
  try {
    steps = deriveLinearSteps(flow)
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : 'Ungültiger Graph',
    }
  }

  const courseIds = new Set(steps.map((s) => s.courseId))
  const courses = await db.course.findMany({
    where: {
      id: { in: [...courseIds] },
      isPublished: true,
    },
    select: { id: true },
  })
  if (courses.length !== courseIds.size) {
    return {
      success: false as const,
      error: 'Nur veröffentlichte Quests sind erlaubt.',
    }
  }

  const normalizedFlow: FlowPayload = {
    ...flow,
    edges: dedupeFlowEdges(flow.edges),
  }

  await db.$transaction(async (tx) => {
    await tx.learningPathStep.deleteMany({ where: { learningPathId: pathId } })

    for (const s of steps) {
      await tx.learningPathStep.create({
        data: {
          learningPathId: pathId,
          courseId: s.courseId,
          position: s.position,
          bonusXp: s.bonusXp,
        },
      })
    }

    await tx.learningPath.update({
      where: { id: pathId },
      data: {
        flowData: normalizedFlow as object,
      },
    })
  })

  return { success: true as const }
}

export async function deleteLearningPath(pathId: string) {
  const user = await requireTeacherOrAdmin()
  if (!user) return { success: false as const, error: 'Unauthorized' }

  const path = await db.learningPath.findUnique({ where: { id: pathId } })
  if (!path || !canEditPath(path.ownerId, user)) {
    return { success: false as const, error: 'Nicht gefunden' }
  }

  await db.learningPath.delete({ where: { id: pathId } })
  return { success: true as const }
}
