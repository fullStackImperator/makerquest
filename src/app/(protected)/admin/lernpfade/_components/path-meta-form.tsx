'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
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
import type { Badge, LearningPath } from '@/generated/client'
import { updateLearningPathMeta } from '../_actions/learning-path-actions'

const difficulties = [
  { value: 'ANFAENGER', label: 'Anfänger' },
  { value: 'FORTGESCHRITTEN', label: 'Fortgeschritten' },
  { value: 'PRO', label: 'Pro' },
] as const

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
  const [difficulty, setDifficulty] = useState(path.difficulty)
  const [badgeId, setBadgeId] = useState(path.badgeId ?? '')
  const [isPublished, setIsPublished] = useState(path.isPublished)
  const [loading, setLoading] = useState(false)

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
    <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <Label>Titel</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Beschreibung</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label>Schwierigkeit</Label>
        <Select
          value={difficulty}
          onValueChange={(v) => setDifficulty(v as typeof difficulty)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {difficulties.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Abschluss-Badge</Label>
        <Select
          value={badgeId || '__none__'}
          onValueChange={(v) => setBadgeId(v === '__none__' ? '' : v)}
        >
          <SelectTrigger>
            <SelectValue />
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
      </div>
      <div className="flex items-center gap-2 md:col-span-2">
        <input
          type="checkbox"
          id="pub"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
          className="size-4"
        />
        <Label htmlFor="pub">Veröffentlicht</Label>
      </div>
      <Button type="button" onClick={save} disabled={loading}>
        Metadaten speichern
      </Button>
    </div>
  )
}
