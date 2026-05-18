'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronDown,
  Loader2,
  Pencil,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { deleteFaqEntry, updateFaqEntry } from '../_actions/faq-actions'

type FaqRow = { id: string; question: string; answer: string }

export function FaqList({
  entries,
  canEdit = false,
}: {
  entries: FaqRow[]
  canEdit?: boolean
}) {
  return (
    <ul className="space-y-2">
      {entries.map((e) => (
        <li key={e.id}>
          <FaqItem entry={e} canEdit={canEdit} />
        </li>
      ))}
    </ul>
  )
}

function FaqItem({ entry, canEdit }: { entry: FaqRow; canEdit: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [question, setQuestion] = useState(entry.question)
  const [answer, setAnswer] = useState(entry.answer)
  const [isPending, startTransition] = useTransition()

  const startEdit = () => {
    setQuestion(entry.question)
    setAnswer(entry.answer)
    setEditing(true)
    setOpen(true)
  }

  const cancel = () => {
    setQuestion(entry.question)
    setAnswer(entry.answer)
    setEditing(false)
  }

  const save = () => {
    startTransition(async () => {
      const r = await updateFaqEntry(entry.id, { question, answer })
      if (!r.success) {
        toast.error(r.error)
        return
      }
      toast.success('Eintrag aktualisiert')
      setEditing(false)
      router.refresh()
    })
  }

  const onDelete = () => {
    startTransition(async () => {
      const r = await deleteFaqEntry(entry.id)
      if (!r.success) {
        toast.error(r.error)
        return
      }
      toast.success('Eintrag gelöscht')
      router.refresh()
    })
  }

  if (editing) {
    return (
      <Card className="border-primary/40">
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`q-${entry.id}`}>Frage</Label>
            <Input
              id={`q-${entry.id}`}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`a-${entry.id}`}>Antwort</Label>
            <Textarea
              id={`a-${entry.id}`}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={5}
            />
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={cancel}
            disabled={isPending}
            className="gap-1"
          >
            <X className="h-4 w-4" />
            Abbrechen
          </Button>
          <Button
            type="button"
            onClick={save}
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Speichere…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Speichern
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        'transition-colors',
        open ? 'bg-muted/40' : 'hover:bg-muted/30',
      )}
    >
      <CardContent className="py-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-start gap-3 py-4 text-left"
        >
          <ChevronDown
            className={cn(
              'mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform',
              open && 'rotate-180',
            )}
          />
          <span className="flex-1 font-medium">{entry.question}</span>
        </button>
        {open && (
          <p className="whitespace-pre-wrap pb-4 pl-7 text-sm text-muted-foreground">
            {entry.answer}
          </p>
        )}
      </CardContent>
      {canEdit && (
        <CardFooter className="justify-end gap-2 border-t bg-muted/20 py-3">
          <Button
            variant="outline"
            size="sm"
            onClick={startEdit}
            className="gap-1"
          >
            <Pencil className="h-3.5 w-3.5" />
            Bearbeiten
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Löschen
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eintrag löschen?</AlertDialogTitle>
                <AlertDialogDescription>
                  „{entry.question}“ wird unwiderruflich aus der FAQ entfernt.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>
                  Abbrechen
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={isPending}
                  onClick={(e) => {
                    e.preventDefault()
                    onDelete()
                  }}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                      Lösche…
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Endgültig löschen
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      )}
    </Card>
  )
}
