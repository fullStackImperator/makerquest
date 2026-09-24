'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { KLASSE_LETTER_OPTIONAL_FROM, KLASSENSTUFEN, parseKlasse } from '@/lib/profile'
import { updateUserProfile } from '../_actions/update-user-profile'

const NO_KLASSE = '__none'

function defaultNotice(oldName: string, blocked: boolean) {
  return blocked
    ? `Dein Name „${oldName}“ wurde von einer Lehrkraft geändert. Beleidigende, extremistische oder erfundene Namen sind bei MakerQuest nicht erlaubt und verstoßen gegen die Regeln unserer Schule. Bitte verwende immer deinen echten Namen.`
    : `Dein Profil wurde von einer Lehrkraft angepasst. Bitte verwende bei MakerQuest immer deinen echten Vor- und Nachnamen.`
}

export function EditUserDialog({
  user,
  open,
  onOpenChange,
}: {
  user: {
    id: string
    name: string
    email: string
    isTeacher: boolean | null
    isAdmin: boolean | null
    klasse: string | null
    image: string | null
    nameBlocked: boolean
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const isStaff = user.isTeacher === true || user.isAdmin === true
  const initial = parseKlasse(user.klasse)

  const [name, setName] = useState(user.nameBlocked ? '' : user.name)
  const [stufe, setStufe] = useState<number | null>(initial.stufe)
  const [letter, setLetter] = useState(initial.letter)
  const [removeImage, setRemoveImage] = useState(false)
  const [sendNotice, setSendNotice] = useState(user.nameBlocked)
  const [notice, setNotice] = useState(defaultNotice(user.name, user.nameBlocked))
  const [pending, startTransition] = useTransition()

  const save = () =>
    startTransition(async () => {
      const result = await updateUserProfile({
        userId: user.id,
        name,
        stufe,
        letter,
        notice: sendNotice ? notice : undefined,
        removeImage,
      })
      if (!result.success) return void toast.error(result.error)
      toast.success(sendNotice ? 'Gespeichert und Hinweis gesendet' : 'Gespeichert')
      onOpenChange(false)
      router.refresh()
    })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nutzer bearbeiten</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {user.nameBlocked && (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Aktueller Name: <strong>„{user.name}“</strong> – nicht erlaubt.
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Vor- und Nachname</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="leer lassen: Schüler muss neuen Namen eingeben"
              maxLength={80}
            />
            <p className="text-muted-foreground text-xs">
              Bleibt das Feld leer, muss der Schüler beim nächsten Seitenaufruf einen
              neuen Namen eingeben.
            </p>
          </div>

          {!isStaff && (
            <div className="space-y-1.5">
              <Label>Klasse</Label>
              <div className="grid grid-cols-[1fr_5rem] gap-2">
                <Select
                  value={stufe === null ? NO_KLASSE : stufe.toString()}
                  onValueChange={(v) => setStufe(v === NO_KLASSE ? null : Number(v))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_KLASSE}>Keine Klasse</SelectItem>
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
                  placeholder={stufe !== null && stufe >= KLASSE_LETTER_OPTIONAL_FROM ? '–' : 'b'}
                  aria-label="Klassenbuchstabe"
                  className="text-center"
                  maxLength={1}
                  disabled={stufe === null}
                />
              </div>
            </div>
          )}

          {user.image && (
            <label className="flex cursor-pointer items-center gap-3 text-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={user.image} alt="" className="size-10 rounded-full object-cover" />
              <Checkbox checked={removeImage} onCheckedChange={(c) => setRemoveImage(c === true)} />
              Profilbild entfernen
            </label>
          )}

          <div className="space-y-2 border-t pt-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <Checkbox checked={sendNotice} onCheckedChange={(c) => setSendNotice(c === true)} />
              Hinweis an den Nutzer senden
            </label>
            {sendNotice && (
              <>
                <Textarea
                  value={notice}
                  onChange={(e) => setNotice(e.target.value)}
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-muted-foreground text-xs">
                  Wird dem Nutzer auf jeder Seite angezeigt, bis er „Verstanden“ klickt.
                </p>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Abbrechen
          </Button>
          <Button onClick={save} disabled={pending || (sendNotice && !notice.trim())} className="gap-1.5">
            {pending && <Loader2 className="size-4 animate-spin" />}
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
