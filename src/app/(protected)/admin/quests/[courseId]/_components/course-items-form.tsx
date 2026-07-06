'use client'

import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

import type { Chapter, Course, Exercise } from '@/generated/client'
import { createChapter } from '../_actions/create_chapter'
import { createExercise } from '../_actions/create-exercise'
import { reorderCourseItems } from '../_actions/reorder-course-items'
import { CourseItemsList } from './course-items-list'
import { mergeCourseItems } from '@/lib/exercises/merge-course-items'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PlusCircle, Loader2 } from 'lucide-react'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface CourseItemsFormProps {
  initialData: Course & { chapters: Chapter[]; exercises?: Exercise[] }
  courseId: string
}

const formSchema = z.object({
  title: z.string().min(1),
})

export function CourseItemsForm({
  initialData,
  courseId,
}: CourseItemsFormProps) {
  const [creatingKind, setCreatingKind] = useState<
    'chapter' | 'exercise' | null
  >(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()

  const items = mergeCourseItems(
    initialData.chapters,
    initialData.exercises ?? [],
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: '' },
  })

  const { isSubmitting, isValid } = form.formState

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!creatingKind) return

    const result =
      creatingKind === 'chapter'
        ? await createChapter(courseId, { title: values.title })
        : await createExercise(courseId, { title: values.title })

    if (result.success) {
      toast.success(
        creatingKind === 'chapter' ? 'Kapitel erstellt' : 'Aufgabe erstellt',
      )
      setCreatingKind(null)
      form.reset()
      if (creatingKind === 'exercise') {
        router.push(`/admin/quests/${courseId}/exercises/${result.id}`)
      } else {
        router.refresh()
      }
    } else {
      toast.error(result.error)
    }
  }

  const onReorder = async (
    updateData: { kind: 'chapter' | 'exercise'; id: string; position: number }[],
  ) => {
    try {
      setIsUpdating(true)
      const result = await reorderCourseItems(courseId, updateData)
      if (result.success) {
        toast.success('Reihenfolge geändert')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const onEdit = (kind: 'chapter' | 'exercise', id: string) => {
    if (kind === 'chapter') {
      router.push(`/admin/quests/${courseId}/chapters/${id}`)
    } else {
      router.push(`/admin/quests/${courseId}/exercises/${id}`)
    }
  }

  return (
    <div className="relative space-y-4">
      {isUpdating && (
        <div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center rounded-lg backdrop-blur-[1px]">
          <Loader2 className="text-foreground size-6 animate-spin" />
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          Kapitel und Aufgaben per Drag &amp; Drop sortieren
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setCreatingKind('chapter')
              form.reset()
            }}
            variant="outline"
            size="sm"
            disabled={!!creatingKind}
          >
            <PlusCircle className="mr-2 size-4" />
            Kapitel
          </Button>
          <Button
            onClick={() => {
              setCreatingKind('exercise')
              form.reset()
            }}
            variant="outline"
            size="sm"
            disabled={!!creatingKind}
          >
            <PlusCircle className="mr-2 size-4" />
            Aufgabe
          </Button>
        </div>
      </div>

      {creatingKind && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="border-border/40 bg-muted/15 space-y-3 rounded-lg border p-4"
          >
            <p className="text-sm font-medium">
              {creatingKind === 'chapter'
                ? 'Neues Kapitel'
                : 'Neue Aufgabe'}
            </p>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="Titel eingeben…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2">
              <Button disabled={!isValid || isSubmitting} type="submit">
                Erstellen
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreatingKind(null)}
              >
                Abbrechen
              </Button>
            </div>
          </form>
        </Form>
      )}

      {!creatingKind && (
        <div
          className={cn(
            'border-border/40 bg-muted/15 rounded-lg border px-2 py-1',
            !items.length &&
              'text-muted-foreground flex min-h-[4rem] items-center justify-center py-8 text-sm italic',
          )}
        >
          {!items.length && 'Noch keine Kapitel oder Aufgaben'}
          {items.length > 0 && (
            <CourseItemsList
              items={items}
              onReorder={onReorder}
              onEdit={onEdit}
            />
          )}
        </div>
      )}
    </div>
  )
}
