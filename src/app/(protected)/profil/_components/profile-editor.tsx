'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { useUploadThing } from '@/lib/uploadthing'
import { KLASSE_LETTER_OPTIONAL_FROM, KLASSENSTUFEN } from '@/lib/profile'
import { updateMyProfile } from '../_actions/update-my-profile'

export function ProfileEditor({
  dashboardHref,
  email,
  initialName,
  initialImage,
  initialStufe,
  initialLetter,
  hasKlasse,
}: {
  /** Where to go after saving. */
  dashboardHref: string
  email: string
  initialName: string
  initialImage: string | null
  initialStufe: number | null
  initialLetter: string
  hasKlasse: boolean
}) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [image, setImage] = useState<string | null>(initialImage)
  const [stufe, setStufe] = useState<number | null>(initialStufe)
  const [letter, setLetter] = useState(initialLetter)
  const [pending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  const { startUpload, isUploading } = useUploadThing('profileImage', {
    onUploadError: (error) => {
      toast.error(error.message || 'Upload fehlgeschlagen')
    },
  })

  const onFile = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    const uploaded = await startUpload([file])
    if (fileRef.current) fileRef.current.value = ''
    const url = uploaded?.[0]?.serverData?.url ?? uploaded?.[0]?.ufsUrl
    if (url) setImage(url)
  }

  const dirty =
    name !== initialName ||
    image !== initialImage ||
    (hasKlasse && (stufe !== initialStufe || letter !== initialLetter))

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const result = await updateMyProfile({ name, stufe, letter, image })
      if (!result.success) return void toast.error(result.error)
      toast.success('Profil gespeichert')
      router.push(dashboardHref)
    })
  }

  const initial = (name.trim() || email).charAt(0).toUpperCase()
  const letterOptional = stufe !== null && stufe >= KLASSE_LETTER_OPTIONAL_FROM

  return (
    <form onSubmit={save} className="bg-card space-y-6 rounded-xl border p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar className="size-20">
          <AvatarImage src={image ?? undefined} alt={name} className="object-cover" />
          <AvatarFallback className="text-2xl font-semibold">{initial}</AvatarFallback>
        </Avatar>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={isUploading || pending}
            onClick={() => fileRef.current?.click()}
          >
            {isUploading ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
            {image ? 'Bild ändern' : 'Bild hochladen'}
          </Button>
          {image && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground gap-1.5"
              disabled={isUploading || pending}
              onClick={() => setImage(null)}
            >
              <Trash2 className="size-3.5" />
              Entfernen
            </Button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files)}
          />
        </div>
        <p className="text-muted-foreground w-full text-xs">
          Nur eigene, passende Bilder. Profilbilder sind für andere sichtbar, und Änderungen
          werden für Lehrkräfte protokolliert.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="profile-name">Vor- und Nachname</Label>
        <Input
          id="profile-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          className="bg-white dark:bg-input/30"
          required
        />
      </div>

      {hasKlasse && (
        <div className="space-y-1.5">
          <Label>Klasse</Label>
          <div className="grid max-w-xs grid-cols-[1fr_5rem] gap-2">
            <Select value={stufe?.toString()} onValueChange={(v) => setStufe(Number(v))}>
              <SelectTrigger className="w-full bg-white dark:bg-input/30" aria-label="Klassenstufe">
                <SelectValue placeholder="Klassenstufe" />
              </SelectTrigger>
              <SelectContent>
                {KLASSENSTUFEN.map((s) => (
                  <SelectItem key={s} value={s.toString()}>
                    Klasse {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={letter}
              onChange={(e) => setLetter(e.target.value.replace(/[^a-z]/gi, '').slice(0, 1).toLowerCase())}
              placeholder={letterOptional ? '–' : 'b'}
              aria-label="Klassenbuchstabe"
              className="bg-white text-center dark:bg-input/30"
              maxLength={1}
            />
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label>E-Mail</Label>
        <p className="text-muted-foreground text-sm">{email}</p>
      </div>

      <div className="flex justify-end border-t pt-4">
        <Button type="submit" disabled={!dirty || pending || isUploading} className="gap-1.5">
          {pending && <Loader2 className="size-4 animate-spin" />}
          Speichern
        </Button>
      </div>
    </form>
  )
}
