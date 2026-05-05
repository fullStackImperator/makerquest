import type { Attachment } from '@/generated/client'

/** Prefer real filenames; older rows may have stored the storage key as `name`. */
export function displayAttachmentName(a: Pick<Attachment, 'name' | 'url'>): string {
  const n = a.name?.trim() ?? ''
  if (n.includes('.') && n.length < 200) return n
  try {
    const u = new URL(a.url)
    const last = decodeURIComponent(
      u.pathname.split('/').filter(Boolean).pop() ?? '',
    )
    if (last.includes('.')) return last
  } catch {
    /* ignore */
  }
  return n || 'Datei'
}
