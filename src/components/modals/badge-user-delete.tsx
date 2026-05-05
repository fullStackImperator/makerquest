'use-client'

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

interface BadgeLoeschenModalProps {
  children: React.ReactNode
  onDelete: (id: string, userId: string, badgeId: string) => void
  userId: string
  badgeId: string
  userBadgeId: string
}

export const BadgeLoeschenModal = ({
  children,
  onDelete,
  userId,
  badgeId,
  userBadgeId,
}: BadgeLoeschenModalProps) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Badge vom Schüler zurücknehmen</AlertDialogTitle>
          <AlertDialogDescription>
            Klicken Sie auf Löschen, um den Badge zurückzunehmen
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Zurück</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onDelete(userId, badgeId, userBadgeId)}
          >
            Löschen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
