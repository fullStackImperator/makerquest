import { cn } from '@/lib/utils'
import type { JournalEntryStatus } from '@/generated/enums'
import { JOURNAL_STATUS_CLASS, JOURNAL_STATUS_LABEL } from '@/lib/journal/shared'

export function JournalStatusBadge({
  status,
  className,
}: {
  status: JournalEntryStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
        JOURNAL_STATUS_CLASS[status],
        className,
      )}
    >
      {JOURNAL_STATUS_LABEL[status]}
    </span>
  )
}
