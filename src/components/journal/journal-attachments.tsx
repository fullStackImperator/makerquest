'use client'

import { Download, FileCode2, FileText, Paperclip, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { formatFileSize, type JournalAttachmentView } from '@/lib/journal/shared'

const CODE_EXTENSIONS = /\.(ino|py|js|ts|c|cpp|h|java|json|html|css|scad)$/i

function kindOf(a: JournalAttachmentView) {
  const type = a.mimeType ?? ''
  if (type.startsWith('image/')) return 'image'
  if (type.startsWith('video/')) return 'video'
  if (type === 'application/pdf' || /\.pdf$/i.test(a.name)) return 'pdf'
  if (CODE_EXTENSIONS.test(a.name)) return 'code'
  return 'file'
}

/**
 * Images and videos render inline, everything else as a download row.
 * With `onRemove`, each item gets a remove button (used in the entry form).
 */
export function JournalAttachments({
  attachments,
  onRemove,
  className,
}: {
  attachments: JournalAttachmentView[]
  onRemove?: (index: number) => void
  className?: string
}) {
  if (attachments.length === 0) return null

  const indexed = attachments.map((a, index) => ({ a, index, kind: kindOf(a) }))
  const media = indexed.filter((x) => x.kind === 'image' || x.kind === 'video')
  const files = indexed.filter((x) => x.kind !== 'image' && x.kind !== 'video')

  return (
    <div className={cn('space-y-2', className)}>
      {media.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {media.map(({ a, index, kind }) => (
            <div
              key={`${a.url}-${index}`}
              className="border-border/60 bg-muted/30 group relative overflow-hidden rounded-lg border"
            >
              {kind === 'image' ? (
                <a href={a.url} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.url}
                    alt={a.name}
                    loading="lazy"
                    className="aspect-4/3 w-full object-cover"
                  />
                </a>
              ) : (
                <video
                  src={a.url}
                  controls
                  preload="metadata"
                  className="aspect-4/3 w-full bg-black object-contain"
                />
              )}
              {onRemove && <RemoveButton onClick={() => onRemove(index)} overlay />}
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map(({ a, index, kind }) => {
            const Icon = kind === 'code' ? FileCode2 : kind === 'pdf' ? FileText : Paperclip
            return (
              <li
                key={`${a.url}-${index}`}
                className="border-border/60 bg-background flex items-center gap-2 rounded-lg border px-3 py-2"
              >
                <Icon className="text-muted-foreground size-4 shrink-0" />
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1 truncate text-sm hover:underline"
                >
                  {a.name}
                </a>
                <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                  {formatFileSize(a.size)}
                </span>
                {onRemove ? (
                  <RemoveButton onClick={() => onRemove(index)} />
                ) : (
                  <a
                    href={a.url}
                    download={a.name}
                    className="text-muted-foreground hover:text-foreground shrink-0 rounded p-1"
                    aria-label={`${a.name} herunterladen`}
                  >
                    <Download className="size-4" />
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function RemoveButton({ onClick, overlay }: { onClick: () => void; overlay?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Datei entfernen"
      className={cn(
        'text-muted-foreground hover:text-foreground shrink-0 rounded p-1 transition-colors',
        overlay && 'bg-background/90 absolute top-1.5 right-1.5 shadow-sm',
      )}
    >
      <X className="size-4" />
    </button>
  )
}
