'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, MessageSquare, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

import { commentOnJournalEntry, reviewJournalEntry } from '@/actions/journal-teacher'
import { JournalEntryCard } from '@/components/journal/journal-entry-card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { formatJournalDateTime } from '@/lib/journal/shared'
import type { TeacherJournalEntryView } from '@/lib/journal/teacher-queries'

export function TeacherEntry({
  entry,
  highlighted,
}: {
  entry: TeacherJournalEntryView
  highlighted?: boolean
}) {
  const latest = entry.versions.length
  const [version, setVersion] = useState(latest)
  const shown = entry.versions.find((v) => v.version === version)

  // Teachers see submitted snapshots only; a student's unsubmitted edits during a
  // revision stay private. Entries without snapshots fall back to the live entry.
  const displayed = shown
    ? { ...entry, title: shown.title, content: shown.content, attachments: shown.attachments }
    : entry

  return (
    <JournalEntryCard
      entry={displayed}
      highlighted={highlighted}
      contentKey={`${entry.id}-v${version}`}
      headerExtra={
        latest > 1 ? (
          <div className="rounded-lg border border-violet-500/40 bg-violet-500/5 p-2">
            <div className="mb-1.5 flex items-center justify-between gap-2 px-1 text-xs">
              <span className="font-semibold text-violet-800 dark:text-violet-200">
                {latest} Versionen eingereicht
              </span>
              {version !== latest && (
                <button
                  type="button"
                  onClick={() => setVersion(latest)}
                  className="text-violet-700 underline-offset-2 hover:underline dark:text-violet-300"
                >
                  zur aktuellen Version
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5" role="tablist">
              {entry.versions.map((v) => (
                <button
                  key={v.version}
                  type="button"
                  role="tab"
                  aria-selected={v.version === version}
                  onClick={() => setVersion(v.version)}
                  className={cn(
                    'rounded-md border px-2.5 py-1 text-left text-xs transition-colors',
                    v.version === version
                      ? 'border-violet-600 bg-violet-600 text-white'
                      : 'border-violet-500/30 bg-background hover:bg-violet-500/10',
                  )}
                >
                  <span className="font-semibold tabular-nums">v{v.version}</span>
                  <span className="ml-1.5 opacity-80">
                    {formatJournalDateTime(v.createdAt)}
                    {v.version === latest && ' · aktuell'}
                  </span>
                </button>
              ))}
            </div>
            {version !== latest && (
              <p className="mt-2 px-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                Du siehst eine ältere Version (v{version}).
              </p>
            )}
          </div>
        ) : undefined
      }
      actions={<ReviewControls entry={entry} />}
    />
  )
}

function ReviewControls({ entry }: { entry: TeacherJournalEntryView }) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [pending, startTransition] = useTransition()

  const run = (action: 'comment' | 'ACCEPTED' | 'REVISE') =>
    startTransition(async () => {
      const result =
        action === 'comment'
          ? await commentOnJournalEntry(entry.id, body)
          : await reviewJournalEntry(entry.id, action, body)
      if (!result.success) return void toast.error(result.error)
      setBody('')
      if (action === 'ACCEPTED') {
        toast.success(
          'xpAwarded' in result && result.xpAwarded
            ? 'Angenommen – Journal-XP vergeben'
            : 'Angenommen',
        )
      } else {
        toast.success(action === 'REVISE' ? 'Überarbeitung angefordert' : 'Kommentar gesendet')
      }
      router.refresh()
    })

  return (
    <div className="space-y-2 border-t pt-3">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Feedback an den Schüler …"
        rows={2}
        maxLength={5000}
        disabled={pending}
        className="resize-y text-sm"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          className="gap-1.5"
          disabled={pending || !body.trim()}
          onClick={() => run('comment')}
        >
          <MessageSquare className="size-3.5" />
          Kommentieren
        </Button>
        <div className="ml-auto flex flex-wrap gap-2">
          {entry.status !== 'REVISE' && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-amber-500/50 text-amber-800 hover:bg-amber-500/10 dark:text-amber-200"
              disabled={pending}
              onClick={() => run('REVISE')}
            >
              <RotateCcw className="size-3.5" />
              Überarbeiten lassen
            </Button>
          )}
          {entry.status !== 'ACCEPTED' && (
            <Button
              size="sm"
              className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={pending}
              onClick={() => run('ACCEPTED')}
            >
              {pending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="size-3.5" />
              )}
              Annehmen
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
