'use client'

import { useEffect, useState } from 'react'

import { searchMessageRecipients } from '@/actions/messages'
import type { RecipientSuggestion } from '@/lib/messages'

/**
 * Students a teacher can write to, searched on the server after a short pause in
 * typing. Results remember their query, so stale ones are ignored.
 */
export function useRecipientSearch(query: string, enabled: boolean) {
  const [result, setResult] = useState<{ query: string; items: RecipientSuggestion[] }>({
    query: '',
    items: [],
  })
  const trimmed = query.trim()
  const active = enabled && trimmed.length >= 2

  useEffect(() => {
    if (!active) return
    let cancelled = false
    const timer = setTimeout(() => {
      searchMessageRecipients(trimmed)
        .catch(() => [])
        .then((items) => !cancelled && setResult({ query: trimmed, items }))
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [active, trimmed])

  return {
    /** A query long enough to search was entered. */
    active,
    searching: active && result.query !== trimmed,
    suggestions: active && result.query === trimmed ? result.items : [],
  }
}
