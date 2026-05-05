'use client'

import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

import type { Chapter, Course } from '@/generated/client'
import { createChapter } from '../_actions/create_chapter'
import { reorderChapters } from '../_actions/reorder-chapters'
import { ChaptersList } from './chapters-list'
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

interface ChaptersFormProps {
  initialData: Course & { chapters: Chapter[] }
  courseId: string
}

const formSchema = z.object({
  title: z.string().min(1),
})

export const ChaptersForm = ({ initialData, courseId }: ChaptersFormProps) => {
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const toggleCreating = () => setIsCreating((current) => !current)

  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
    },
  })

  const { isSubmitting, isValid } = form.formState

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const result = await createChapter(courseId, { title: values.title })
    if (result.success) {
      toast.success('Kapitel erstellt')
      toggleCreating()
      form.reset()
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  const onReorder = async (updateData: { id: string; position: number }[]) => {
    try {
      setIsUpdating(true)
      const result = await reorderChapters(courseId, updateData)
      if (result.success) {
        toast.success('Kapitelreihenfolge geändert')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const onEdit = (id: string) => {
    router.push(`/admin/quests/${courseId}/chapters/${id}`)
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
          Reihenfolge per Drag &amp; Drop ändern
        </p>
        <Button onClick={toggleCreating} variant="outline" size="sm">
          {isCreating ? (
            'Abbrechen'
          ) : (
            <>
              <PlusCircle className="mr-2 size-4" />
              Kapitel hinzufügen
            </>
          )}
        </Button>
      </div>
      {isCreating && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="border-border/40 bg-muted/15 space-y-3 rounded-lg border p-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="e.g. 'Einführung in das Projekt...'"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button disabled={!isValid || isSubmitting} type="submit">
              Erstellen
            </Button>
          </form>
        </Form>
      )}
      {!isCreating && (
        <div
          className={cn(
            'border-border/40 bg-muted/15 rounded-lg border px-2 py-1',
            !initialData.chapters.length &&
              'text-muted-foreground flex min-h-[4rem] items-center justify-center py-8 text-sm italic',
          )}
        >
          {!initialData.chapters.length && 'Noch keine Kapitel'}
          {initialData.chapters.length > 0 && (
            <ChaptersList
              onEdit={onEdit}
              onReorder={onReorder}
              items={initialData.chapters || []}
            />
          )}
        </div>
      )}
    </div>
  )
}
