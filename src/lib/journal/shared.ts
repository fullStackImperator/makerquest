import type {
  JournalEntryStatus,
  JournalEventKind,
  RubricLevel,
} from '@/generated/enums'

/** Serializable journal entry as rendered in the timelines. */
export type JournalEntryView = {
  id: string
  courseId: string
  courseTitle: string
  chapterId: string | null
  chapterTitle: string | null
  title: string | null
  content: unknown
  status: JournalEntryStatus
  entryDate: string
  submittedAt: string | null
  versionCount: number
  attachments: JournalAttachmentView[]
  events: JournalEventView[]
}

export type JournalAttachmentView = {
  id?: string
  url: string
  fileKey?: string | null
  name: string
  mimeType?: string | null
  size?: number | null
}

export type JournalEventView = {
  id: string
  kind: JournalEventKind
  body: string | null
  createdAt: string
  authorName: string
  authorIsStudent: boolean
}

export type JournalQuestOption = {
  id: string
  title: string
  chapters: { id: string; title: string }[]
}

export type JournalQuestGroup = {
  /** Learning path title, or null for quests outside any path. */
  learningPathTitle: string | null
  quests: JournalQuestOption[]
}

export const JOURNAL_STATUS_LABEL: Record<JournalEntryStatus, string> = {
  DRAFT: 'Entwurf',
  READY: 'Eingereicht',
  REVISE: 'Überarbeiten',
  ACCEPTED: 'Angenommen',
}

export const JOURNAL_STATUS_CLASS: Record<JournalEntryStatus, string> = {
  DRAFT: 'border-border bg-muted text-muted-foreground',
  READY: 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  REVISE:
    'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200',
  ACCEPTED:
    'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
}

export const JOURNAL_EVENT_LABEL: Record<JournalEventKind, string> = {
  COMMENT: 'Kommentar',
  SUBMITTED: 'Eingereicht',
  REVISION_REQUESTED: 'Überarbeitung angefordert',
  ACCEPTED: 'Angenommen',
}

export const RUBRIC_LEVELS: RubricLevel[] = ['NOT_MET', 'PARTIAL', 'MET', 'EXCEEDED']

export const RUBRIC_LEVEL_LABEL: Record<RubricLevel, string> = {
  NOT_MET: 'nicht erreicht',
  PARTIAL: 'teilweise erreicht',
  MET: 'erreicht',
  EXCEEDED: 'übertroffen',
}

export const RUBRIC_LEVEL_CLASS: Record<RubricLevel, string> = {
  NOT_MET: 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  PARTIAL: 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200',
  MET: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  EXCEEDED: 'border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300',
}

/** Most frequent criterion level (ties go to the lower level) as a suggestion for the overall level. */
export function suggestOverallLevel(levels: RubricLevel[]): RubricLevel | null {
  if (levels.length === 0) return null
  let best: RubricLevel | null = null
  let bestCount = 0
  for (const level of RUBRIC_LEVELS) {
    const count = levels.filter((l) => l === level).length
    if (count > bestCount) {
      best = level
      bestCount = count
    }
  }
  return best
}

/** Students may only change entries in these states. */
export function isJournalEntryEditable(status: JournalEntryStatus) {
  return status === 'DRAFT' || status === 'REVISE'
}

/** Rough upper bound for the stored editor JSON (images are URLs, not base64). */
export const JOURNAL_CONTENT_MAX_BYTES = 1_000_000

/** Attachments must come from our UploadThing app. */
export function isUploadThingUrl(url: string) {
  try {
    const { protocol, hostname } = new URL(url)
    return (
      protocol === 'https:' &&
      (hostname === 'utfs.io' ||
        hostname === 'uploadthing.com' ||
        hostname.endsWith('.ufs.sh'))
    )
  } catch {
    return false
  }
}

/** True when a serialized Lexical document contains any text or embedded block. */
export function lexicalHasContent(node: unknown): boolean {
  if (!node || typeof node !== 'object') return false
  const n = node as { type?: string; text?: string; children?: unknown[] }
  if (n.type === 'text') return !!n.text?.trim()
  if (n.type && !['root', 'paragraph', 'linebreak', 'heading', 'quote', 'list', 'listitem'].includes(n.type)) {
    return true
  }
  const children = n.children ?? (n as { root?: unknown }).root
  if (Array.isArray(children)) return children.some(lexicalHasContent)
  return children ? lexicalHasContent(children) : false
}

export function formatJournalDate(iso: string) {
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Berlin',
  }).format(new Date(iso))
}

export function formatJournalDateTime(iso: string) {
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Berlin',
  }).format(new Date(iso))
}

export function formatFileSize(bytes?: number | null) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
