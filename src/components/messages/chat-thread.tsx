'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { Loader2, MessagesSquare, SendHorizontal } from 'lucide-react'
import { toast } from 'sonner'

import { fetchThread, sendMessage } from '@/actions/messages'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Bubble, BubbleContent, BubbleGroup } from '@/components/ui/bubble'
import { Button } from '@/components/ui/button'
import { Marker, MarkerContent } from '@/components/ui/marker'
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from '@/components/ui/message'
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/components/ui/message-scroller'
import { Textarea } from '@/components/ui/textarea'
import type { ChatMessageView, ThreadKey } from '@/lib/messages'

const POLL_MS = 20_000
const MAX_LENGTH = 2000
/** Messages by the same person within this window are grouped under one avatar. */
const GROUP_MS = 5 * 60_000

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join('') || '?'
  )
}

const dayFormat = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
const timeFormat = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' })

function dayLabel(iso: string) {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Heute'
  if (date.toDateString() === yesterday.toDateString()) return 'Gestern'
  return dayFormat.format(date)
}

type Group = { key: string; day: string | null; authorId: string | null; messages: ChatMessageView[] }

/** Consecutive messages of one author become one group; a new day starts a new group with a separator. */
function groupMessages(messages: ChatMessageView[]): Group[] {
  const groups: Group[] = []
  for (const m of messages) {
    const last = groups.at(-1)
    const lastMessage = last?.messages.at(-1)
    const day = new Date(m.createdAt).toDateString()
    const sameDay = lastMessage && new Date(lastMessage.createdAt).toDateString() === day
    if (
      last &&
      lastMessage &&
      sameDay &&
      last.authorId === m.authorId &&
      new Date(m.createdAt).getTime() - new Date(lastMessage.createdAt).getTime() < GROUP_MS
    ) {
      last.messages.push(m)
    } else {
      groups.push({ key: m.id, day: sameDay ? null : dayLabel(m.createdAt), authorId: m.authorId, messages: [m] })
    }
  }
  return groups
}

export function ChatThread({
  thread,
  viewerId,
  initialMessages,
  emptyHint,
  onActivity,
}: {
  thread: ThreadKey
  viewerId: string
  initialMessages: ChatMessageView[]
  /** Shown while the thread has no messages. */
  emptyHint: string
  /** Called after sending or receiving, e.g. to refresh an inbox. */
  onActivity?: () => void
}) {
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState('')
  const [sending, startSending] = useTransition()
  const latestRef = useRef(initialMessages.at(-1)?.createdAt)
  // Parents pass the key as a fresh object each render; a ref keeps polling from restarting.
  const threadRef = useRef(thread)
  useEffect(() => {
    threadRef.current = thread
  })

  const merge = useCallback((incoming: ChatMessageView[]) => {
    if (incoming.length === 0) return
    setMessages((prev) => {
      const known = new Set(prev.map((m) => m.id))
      const next = [...prev, ...incoming.filter((m) => !known.has(m.id))]
      latestRef.current = next.at(-1)?.createdAt
      return next
    })
  }, [])

  const poll = useCallback(async () => {
    const result = await fetchThread({ thread: threadRef.current, after: latestRef.current }).catch(() => null)
    if (result?.success && result.messages.length > 0) {
      merge(result.messages)
      onActivity?.()
    }
  }, [merge, onActivity])

  useEffect(() => {
    const interval = setInterval(() => document.visibilityState === 'visible' && poll(), POLL_MS)
    const onVisible = () => document.visibilityState === 'visible' && poll()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [poll])

  const send = () => {
    const body = draft.trim()
    if (!body || sending) return
    startSending(async () => {
      const result = await sendMessage({ thread: threadRef.current, body })
      if (!result.success) return void toast.error(result.error)
      setDraft('')
      merge([result.message])
      onActivity?.()
    })
  }

  const groups = groupMessages(messages)

  return (
    // Sized by its content: grows with the conversation until the parent's height is reached, then scrolls.
    <div className="flex min-h-0 flex-initial flex-col">
      <MessageScrollerProvider defaultScrollPosition="end" autoScroll>
        <MessageScroller className="h-auto min-h-0 flex-initial">
          <MessageScrollerViewport aria-label="Nachrichten">
            <MessageScrollerContent className="gap-4 p-4">
              {groups.length === 0 ? (
                <div className="text-muted-foreground mx-auto flex max-w-xs flex-col items-center gap-2 py-6 text-center text-sm">
                  <MessagesSquare className="size-7" aria-hidden />
                  {emptyHint}
                </div>
              ) : (
                groups.map((group) => {
                  const first = group.messages[0]!
                  const last = group.messages.at(-1)!
                  const mine = group.authorId === viewerId
                  return (
                    <MessageScrollerItem key={group.key} messageId={group.key} className="space-y-4">
                      {group.day && (
                        <Marker variant="separator">
                          <MarkerContent className="text-xs">{group.day}</MarkerContent>
                        </Marker>
                      )}
                      <Message align={mine ? 'end' : 'start'}>
                        {!mine && (
                          <MessageAvatar>
                            <Avatar className="size-8">
                              {first.authorImage && <AvatarImage src={first.authorImage} alt="" />}
                              <AvatarFallback className="text-xs">{initials(first.authorName)}</AvatarFallback>
                            </Avatar>
                          </MessageAvatar>
                        )}
                        <MessageContent>
                          {!mine && (
                            <MessageHeader>
                              {first.authorName}
                              {!first.fromStudent && (
                                <span className="text-muted-foreground/80 ml-1 font-normal">· Lehrkraft</span>
                              )}
                            </MessageHeader>
                          )}
                          <BubbleGroup>
                            {group.messages.map((m) => (
                              <Bubble key={m.id} variant={mine ? 'default' : 'muted'}>
                                <BubbleContent className="whitespace-pre-wrap">{m.body}</BubbleContent>
                              </Bubble>
                            ))}
                          </BubbleGroup>
                          <MessageFooter>{timeFormat.format(new Date(last.createdAt))}</MessageFooter>
                        </MessageContent>
                      </Message>
                    </MessageScrollerItem>
                  )
                })
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>

      <form
        className="flex items-end gap-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
      >
        <div className="flex-1 space-y-1">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends, Shift+Enter adds a line.
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                send()
              }
            }}
            placeholder="Nachricht schreiben …"
            rows={1}
            maxLength={MAX_LENGTH}
            className="max-h-40 min-h-10 resize-none"
            aria-label="Nachricht"
          />
          {draft.length > MAX_LENGTH - 200 && (
            <p className="text-muted-foreground text-right text-[11px] tabular-nums">
              {draft.length}/{MAX_LENGTH}
            </p>
          )}
        </div>
        <Button type="submit" size="icon" disabled={sending || !draft.trim()} aria-label="Senden">
          {sending ? <Loader2 className="size-4 animate-spin" /> : <SendHorizontal className="size-4" />}
        </Button>
      </form>
    </div>
  )
}
