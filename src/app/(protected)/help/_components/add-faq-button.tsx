'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createFaqEntry } from '../_actions/faq-actions'

export function AddFaqButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [isPending, startTransition] = useTransition()

  const reset = () => {
    setQuestion('')
    setAnswer('')
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const r = await createFaqEntry({ question, answer })
      if (!r.success) {
        toast.error(r.error)
        return
      }
      toast.success('FAQ-Eintrag angelegt')
      reset()
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Neue Frage
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neuer FAQ-Eintrag</DialogTitle>
          <DialogDescription>
            Lege eine Frage und die passende Antwort an. Sichtbar für alle
            Nutzer:innen unter „Hilfe“.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="faq-question">
              Frage <span className="text-destructive">*</span>
            </Label>
            <Input
              id="faq-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="z. B. Wie sammle ich XP?"
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="faq-answer">
              Antwort <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="faq-answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Antwort an Schüler:innen, einfach formuliert."
              rows={5}
              required
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={isPending}>
                Abbrechen
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Wird angelegt…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Anlegen
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
