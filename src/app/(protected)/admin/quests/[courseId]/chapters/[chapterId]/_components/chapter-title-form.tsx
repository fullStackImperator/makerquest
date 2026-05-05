'use client'

import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { toast } from 'sonner'
import { updateChapter } from '../_actions/udate-chapter'

interface ChapterTitleFormProps {
  initialData: { title: string }
  courseId: string
  chapterId: string
}

const formSchema = z.object({
  title: z.string().min(1),
})

export const ChapterTitleForm = ({
  initialData,
  courseId,
  chapterId,
}: ChapterTitleFormProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  })

  const { isSubmitting, isValid } = form.formState

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const result = await updateChapter(courseId, chapterId, values)
    if (!result.success) return toast.error(result.error)
    toast.success('Titel gespeichert')
    setIsEditing(false)
    router.refresh()
  }

  if (!isEditing) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="text-foreground text-lg font-medium leading-snug">
          {initialData.title}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => {
            form.reset(initialData)
            setIsEditing(true)
          }}
        >
          <Pencil className="mr-2 size-4" />
          Titel ändern
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  disabled={isSubmitting}
                  placeholder="z. B. Einführung"
                  autoFocus
                  className="text-base"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-wrap gap-2">
          <Button disabled={!isValid || isSubmitting} type="submit" size="sm">
            Speichern
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              form.reset(initialData)
              setIsEditing(false)
            }}
          >
            Abbrechen
          </Button>
        </div>
      </form>
    </Form>
  )
}
