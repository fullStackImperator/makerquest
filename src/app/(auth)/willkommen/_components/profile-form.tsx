'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
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
import { authClient } from '@/lib/auth-client'
import { KLASSE_LETTER_OPTIONAL_FROM, KLASSENSTUFEN } from '@/lib/profile'
import { completeProfile } from '../_actions/complete-profile'

export function ProfileForm({
  email,
  initialName,
  isStaff,
  initialStufe,
  initialLetter,
}: {
  email: string
  initialName: string
  /** Teachers and admins only need a name. */
  isStaff: boolean
  initialStufe: number | null
  initialLetter: string
}) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [requestTeacher, setRequestTeacher] = useState(false)
  const [stufe, setStufe] = useState<number | null>(initialStufe)
  const [letter, setLetter] = useState(initialLetter)
  const [pending, startTransition] = useTransition()

  const askKlasse = !isStaff && !requestTeacher
  const letterOptional = stufe !== null && stufe >= KLASSE_LETTER_OPTIONAL_FROM

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      // On success the action redirects to the dashboard and doesn't return.
      const result = await completeProfile({ name, requestTeacher, stufe, letter })
      if (result && !result.success) toast.error(result.error)
    })
  }

  const switchAccount = async () => {
    await authClient.signOut()
    router.push('/login')
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Willkommen bei MakerQuest!</CardTitle>
        <CardDescription>
          {isStaff
            ? 'Bitte gib noch deinen Namen an.'
            : 'Bevor es losgeht: Wie heißt du und in welche Klasse gehst du?'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Vor- und Nachname</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z. B. Mia Schneider"
              autoComplete="name"
              maxLength={80}
              required
              autoFocus
            />
            <p className="text-muted-foreground text-xs">
              So sehen dich deine Lehrkräfte im Journal und bei Bewertungen.
            </p>
          </div>

          {!isStaff && (
            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <Checkbox
                checked={requestTeacher}
                onCheckedChange={(checked) => setRequestTeacher(checked === true)}
                className="mt-0.5"
              />
              <span>
                Ich bin Lehrkraft
                <span className="text-muted-foreground block text-xs">
                  Ein Admin prüft dein Konto und schaltet die Lehrkraft-Funktionen frei.
                </span>
              </span>
            </label>
          )}

          {askKlasse && (
            <div className="space-y-1.5">
              <Label>Klasse</Label>
              <div className="grid grid-cols-[1fr_5rem] gap-2">
                <Select
                  value={stufe?.toString()}
                  onValueChange={(value) => setStufe(Number(value))}
                >
                  <SelectTrigger className="w-full" aria-label="Klassenstufe">
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
                  className="text-center"
                  maxLength={1}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                {letterOptional
                  ? 'In der Oberstufe ist der Buchstabe optional.'
                  : 'Klassenstufe und Buchstabe, z. B. 8 und b für die 8b.'}
              </p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Weiter
          </Button>

          <p className="text-muted-foreground text-center text-xs">
            Angemeldet als {email} ·{' '}
            <button type="button" onClick={switchAccount} className="underline underline-offset-2">
              anderes Konto
            </button>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
