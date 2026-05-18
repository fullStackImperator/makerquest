import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Route } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CreateLearningPathForm } from '../_components/create-learning-path-form'
import { getSessionUser } from '@/lib/get-session-user'
import { db } from '@/lib/db'

export default async function NewLearningPathPage() {
  const user = await getSessionUser()
  if (!user) redirect('/')
  if (!user.isTeacher && !user.isAdmin) redirect('/')

  const badges = await db.badge.findMany({ orderBy: { name: 'asc' } })

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 p-4 md:p-6">
      <Link
        href="/admin/lernpfade"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zu Lernpfaden
      </Link>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="space-y-2">
        <div className="flex items-center gap-2.5 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          <Route className="h-5 w-5" />
          <span>Admin</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Neuer Lernpfad
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          Lege die Grunddaten fest. Quests und Reihenfolge bestimmst du im
          nächsten Schritt im Editor.
        </p>
      </header>

      {/* ── Form Card ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Grunddaten</CardTitle>
          <CardDescription>
            Titel, Beschreibung, Schwierigkeit und optional ein Abschluss-Badge.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateLearningPathForm badges={badges} />
        </CardContent>
      </Card>
    </div>
  )
}
