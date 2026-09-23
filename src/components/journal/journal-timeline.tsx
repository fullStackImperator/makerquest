import Link from 'next/link'
import { NotebookPen, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { JournalEntryView } from '@/lib/journal/shared'
import { JournalEntryCard } from './journal-entry-card'

/** A student's entries, oldest on top, with a "new entry" action at the end. */
export function JournalTimeline({
  entries,
  basePath,
  newHref,
  showQuest = false,
}: {
  entries: JournalEntryView[]
  /** Edit links are `${basePath}/${entryId}`. */
  basePath: string
  newHref: string
  showQuest?: boolean
}) {
  if (entries.length === 0) {
    return (
      <div className="border-border/60 bg-muted/20 flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
        <NotebookPen className="text-muted-foreground size-8" aria-hidden />
        <div className="space-y-1">
          <p className="font-medium">Noch keine Einträge</p>
          <p className="text-muted-foreground max-w-sm text-sm">
            Halte fest, was du gebaut, ausprobiert und gelernt hast – mit Text,
            Fotos, Videos und Dateien.
          </p>
        </div>
        <Button asChild className="gap-1.5">
          <Link href={newHref}>
            <Plus className="size-4" />
            Ersten Eintrag schreiben
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <JournalEntryCard
          key={entry.id}
          entry={entry}
          editHref={`${basePath}/${entry.id}`}
          showQuest={showQuest}
        />
      ))}
      <div className="pl-8">
        <Button asChild variant="outline" className="w-full gap-1.5 border-dashed">
          <Link href={newHref}>
            <Plus className="size-4" />
            Neuer Eintrag
          </Link>
        </Button>
      </div>
    </div>
  )
}
