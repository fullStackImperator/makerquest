'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Award, Loader2, Save, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { Badge, LearningPath } from '@/generated/client'
import { updateLearningPathMeta } from '../_actions/learning-path-actions'

const difficulties = [
  {
    value: 'ANFAENGER',
    label: 'Anfänger',
    emoji: '🌱',
    hint: 'Geeignet für den Einstieg',
    pillClass:
      'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    activeClass:
      'border-emerald-500 bg-emerald-500/15 ring-2 ring-emerald-500/30',
  },
  {
    value: 'FORTGESCHRITTEN',
    label: 'Fortgeschritten',
    emoji: '⚔️',
    hint: 'Solides Grundwissen nötig',
    pillClass:
      'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    activeClass:
      'border-amber-500 bg-amber-500/15 ring-2 ring-amber-500/30',
  },
  {
    value: 'PRO',
    label: 'Pro',
    emoji: '👑',
    hint: 'Für erfahrene Maker',
    pillClass:
      'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300',
    activeClass: 'border-rose-500 bg-rose-500/15 ring-2 ring-rose-500/30',
  },
] as const

type Difficulty = (typeof difficulties)[number]['value']

export function PathMetaForm({
  path,
  badges,
}: {
  path: LearningPath
  badges: Badge[]
}) {
  const router = useRouter()
  const [title, setTitle] = useState(path.title)
  const [description, setDescription] = useState(path.description ?? '')
  const [difficulty, setDifficulty] = useState<Difficulty>(
    path.difficulty as Difficulty,
  )
  const [badgeId, setBadgeId] = useState(path.badgeId ?? '')
  const [isPublished, setIsPublished] = useState(path.isPublished)
  const [loading, setLoading] = useState(false)

  const selectedBadge = useMemo(
    () => badges.find((b) => b.id === badgeId) ?? null,
    [badgeId, badges],
  )

  const save = async () => {
    setLoading(true)
    try {
      const result = await updateLearningPathMeta(path.id, {
        title,
        description: description || null,
        difficulty,
        badgeId: badgeId || null,
        isPublished,
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('Gespeichert')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Metadaten</CardTitle>
        <CardDescription>
          Titel, Beschreibung, Schwierigkeit, Belohnung und Veröffentlichung.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">
            Titel <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z. B. 3D-Druck Basics"
            required
          />
          {path.slug && (
            <p className="text-xs text-muted-foreground">
              Pfad-URL:{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">
                /lernpfade/.../{path.slug}
              </code>
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="desc">Beschreibung</Label>
          <Textarea
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Worum geht es in diesem Lernpfad?"
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Wird in der Lernpfad-Übersicht und auf der Detailseite angezeigt.
          </p>
        </div>

        {/* Difficulty pills */}
        <div className="space-y-2">
          <Label>Schwierigkeit</Label>
          <div className="grid gap-2 sm:grid-cols-3">
            {difficulties.map((d) => {
              const active = difficulty === d.value
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDifficulty(d.value)}
                  aria-pressed={active}
                  className={cn(
                    'flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition-all',
                    'hover:bg-muted/50',
                    active ? d.activeClass : 'border-border bg-card',
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                      d.pillClass,
                    )}
                  >
                    <span aria-hidden>{d.emoji}</span>
                    {d.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {d.hint}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Reward badge */}
        <div className="space-y-2">
          <Label htmlFor="badge">Abschluss-Badge (optional)</Label>
          <Select
            value={badgeId || '__none__'}
            onValueChange={(v) => setBadgeId(v === '__none__' ? '' : v)}
          >
            <SelectTrigger id="badge">
              <SelectValue placeholder="Keins" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Keins</SelectItem>
              {badges.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedBadge ? (
            <div className="flex items-center gap-3 rounded-lg border border-amber-400/30 bg-amber-500/5 p-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-amber-400/40 bg-background">
                <Image
                  src={selectedBadge.imageUrl}
                  alt={`Badge: ${selectedBadge.name}`}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  <Sparkles className="h-3 w-3" />
                  Belohnung
                </p>
                <p className="truncate text-sm font-semibold">
                  {selectedBadge.name}
                </p>
                {selectedBadge.description && (
                  <p className="line-clamp-2 text-[11px] text-muted-foreground">
                    {selectedBadge.description}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Award className="h-3.5 w-3.5" />
              Kein Badge — Nutzer:innen erhalten kein Abzeichen am Ende des
              Lernpfads.
            </p>
          )}
        </div>

        {/* Publish toggle */}
        <div
          className={cn(
            'flex items-start gap-3 rounded-lg border p-3 transition-colors',
            isPublished
              ? 'border-emerald-500/40 bg-emerald-500/5'
              : 'border-border bg-muted/30',
          )}
        >
          <Checkbox
            id="pub"
            checked={isPublished}
            onCheckedChange={(v) => setIsPublished(v === true)}
            className="mt-0.5"
          />
          <div className="space-y-1">
            <Label htmlFor="pub" className="cursor-pointer">
              Veröffentlicht
            </Label>
            <p className="text-xs text-muted-foreground">
              {isPublished
                ? 'Der Lernpfad ist für alle Nutzer:innen sichtbar.'
                : 'Entwurf — nur du siehst diesen Lernpfad.'}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button
          type="button"
          onClick={save}
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Wird gespeichert…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Metadaten speichern
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
