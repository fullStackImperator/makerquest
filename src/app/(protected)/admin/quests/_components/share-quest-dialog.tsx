'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  getCourseShareState,
  updateCourseShares,
  type ShareableTeacher,
} from '../_actions/share-course'

interface ShareQuestDialogProps {
  courseId: string
  courseTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShareQuestDialog({
  courseId,
  courseTitle,
  open,
  onOpenChange,
}: ShareQuestDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [teachers, setTeachers] = React.useState<ShareableTeacher[]>([])
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    if (!open) return

    let cancelled = false
    setIsLoading(true)
    getCourseShareState(courseId)
      .then((res) => {
        if (cancelled) return
        if (!res.success) {
          toast.error(res.error)
          onOpenChange(false)
          return
        }
        setTeachers(res.data.teachers)
        setSelected(new Set(res.data.selectedIds))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, courseId, onOpenChange])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const onSave = async () => {
    setIsSaving(true)
    try {
      const res = await updateCourseShares(courseId, [...selected])
      if (!res.success) return toast.error(res.error)
      toast.success('Freigabe gespeichert')
      onOpenChange(false)
      router.refresh()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Quest freigeben
          </DialogTitle>
          <DialogDescription>
            Wähle Lehrkräfte aus, die „{courseTitle}“ sehen und bearbeiten
            dürfen.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <Command className="rounded-md border">
            <CommandInput placeholder="Lehrkräfte suchen..." />
            <CommandList>
              <CommandEmpty>Keine Lehrkräfte gefunden.</CommandEmpty>
              <CommandGroup>
                {teachers.map((teacher) => {
                  const label = teacher.name || teacher.email
                  const isChecked = selected.has(teacher.id)
                  return (
                    <CommandItem
                      key={teacher.id}
                      value={`${teacher.name} ${teacher.email}`}
                      onSelect={() => toggle(teacher.id)}
                      className="cursor-pointer gap-3"
                    >
                      <Checkbox
                        checked={isChecked}
                        className="pointer-events-none"
                      />
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm">{label}</span>
                        {teacher.name && (
                          <span className="truncate text-xs text-muted-foreground">
                            {teacher.email}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        )}

        <DialogFooter>
          <span className="mr-auto self-center text-xs text-muted-foreground">
            {selected.size} ausgewählt
          </span>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Abbrechen
          </Button>
          <Button onClick={onSave} disabled={isLoading || isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
