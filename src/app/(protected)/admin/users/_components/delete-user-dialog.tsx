'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2 } from 'lucide-react'
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
} from '@/components/ui/alert-dialog'
import { deleteUser } from '../_actions/delete-user'

export function DeleteUserDialog({
  user,
  open,
  onOpenChange,
}: {
  user: { id: string; name: string; email: string; ownedCourses: number; ownedLearningPaths: number }
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const onConfirm = () =>
    startTransition(async () => {
      const result = await deleteUser(user.id)
      if (!result.success) return void toast.error(result.error)
      toast.success('Nutzer gelöscht')
      onOpenChange(false)
      router.refresh()
    })

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Nutzer löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            „{user.name || user.email}“ ({user.email}) wird unwiderruflich gelöscht –
            inklusive Fortschritt, Punkten, Journal-Einträgen, Bewertungen und
            Benachrichtigungen. Hochgeladene Dateien (Profilbild, Journal-Anhänge) werden
            ebenfalls entfernt.
          </AlertDialogDescription>
          {(user.ownedCourses > 0 || user.ownedLearningPaths > 0) && (
            <p className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm">
              {user.ownedCourses} Quest(s) und {user.ownedLearningPaths} Lernpfad(e) werden
              an den Owner übertragen.
            </p>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
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
  )
}
