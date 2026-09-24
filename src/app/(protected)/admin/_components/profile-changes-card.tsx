import Link from 'next/link'
import { ArrowRight, ShieldAlert, UserPen } from 'lucide-react'

import { db } from '@/lib/db'
import { cn } from '@/lib/utils'

const FIELD_LABEL: Record<string, string> = { name: 'Name', klasse: 'Klasse', image: 'Profilbild' }
const SOURCE_LABEL: Record<string, string> = {
  onboarding: 'bei der Anmeldung',
  profile: 'selbst geändert',
  teacher: 'durch Lehrkraft',
}

function when(date: Date) {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Berlin',
  }).format(date)
}

function Value({ field, value }: { field: string; value: string | null }) {
  if (!value) return <span className="text-muted-foreground italic">leer</span>
  if (field === 'image') {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={value} alt="" className="inline-block size-8 rounded-full border object-cover align-middle" />
  }
  return <span className="font-medium">„{value}“</span>
}

/** Latest name/Klasse/avatar changes, rejected name attempts highlighted. */
export async function ProfileChangesCard() {
  const changes = await db.profileChange.findMany({
    orderBy: { createdAt: 'desc' },
    take: 12,
    include: {
      user: { select: { name: true, email: true } },
      actor: { select: { id: true, name: true } },
    },
  })

  return (
    <section className="bg-card rounded-2xl border">
      <div className="flex items-center justify-between gap-2 border-b px-5 py-3">
        <h2 className="flex items-center gap-2 font-medium">
          <UserPen className="text-muted-foreground size-4" />
          Profiländerungen
        </h2>
        <Link
          href="/admin/users"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          Nutzer verwalten <ArrowRight className="size-3.5" />
        </Link>
      </div>
      {changes.length === 0 ? (
        <p className="text-muted-foreground px-5 py-6 text-sm">Noch keine Änderungen protokolliert.</p>
      ) : (
        <ul className="divide-y">
          {changes.map((c) => {
            const byTeacher = c.source === 'teacher'
            return (
              <li
                key={c.id}
                className={cn(
                  'flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-2.5 text-sm',
                  c.blocked && 'bg-destructive/5',
                )}
              >
                <span className="text-muted-foreground w-24 shrink-0 text-xs tabular-nums">
                  {when(c.createdAt)}
                </span>
                <span className="min-w-0 truncate font-medium" title={c.user.email}>
                  {c.user.name?.trim() || c.user.email}
                </span>
                {c.blocked ? (
                  <span className="inline-flex items-center gap-1.5 text-destructive">
                    <ShieldAlert className="size-4" />
                    versuchte Namen <strong>„{c.newValue}“</strong> – gesperrt
                  </span>
                ) : (
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="text-muted-foreground">{FIELD_LABEL[c.field] ?? c.field}:</span>
                    <Value field={c.field} value={c.oldValue} />
                    <ArrowRight className="text-muted-foreground size-3.5" />
                    <Value field={c.field} value={c.newValue} />
                  </span>
                )}
                <span
                  className={cn(
                    'ml-auto rounded-full px-2 py-0.5 text-[11px]',
                    byTeacher ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {byTeacher && c.actor?.name ? `${c.actor.name}` : SOURCE_LABEL[c.source] ?? c.source}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
