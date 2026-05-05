'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import slugify from 'slugify'
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
import type { Badge } from '@/generated/client'
import { createLearningPath } from '../_actions/learning-path-actions'

const difficulties = [
  { value: 'ANFAENGER', label: 'Anfänger' },
  { value: 'FORTGESCHRITTEN', label: 'Fortgeschritten' },
  { value: 'PRO', label: 'Pro' },
] as const

export function CreateLearningPathForm({ badges }: { badges: Badge[] }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] =
    useState<(typeof difficulties)[number]['value']>('ANFAENGER')
  const [badgeId, setBadgeId] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const onTitle = (v: string) => {
    setTitle(v)
    if (!slug || slug === slugify(title, { lower: true, strict: true })) {
      setSlug(slugify(v, { lower: true, strict: true }))
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await createLearningPath({
        title,
        description: description || undefined,
        difficulty,
        slug: slug || slugify(title, { lower: true, strict: true }),
        badgeId: badgeId || null,
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('Lernpfad angelegt')
      router.push(`/admin/lernpfade/${result.id}/edit`)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Titel</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => onTitle(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">URL-Slug</Label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="desc">Beschreibung</Label>
        <Textarea
          id="desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label>Schwierigkeit</Label>
        <Select
          value={difficulty}
          onValueChange={(v) =>
            setDifficulty(v as (typeof difficulties)[number]['value'])
          }
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
        <Label>Abschluss-Badge (optional)</Label>
        <Select value={badgeId || '__none__'} onValueChange={(v) => setBadgeId(v === '__none__' ? '' : v)}>
          <SelectTrigger>
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
      </div>
      <Button type="submit" disabled={loading}>
        Anlegen & weiter
      </Button>
    </form>
  )
}
