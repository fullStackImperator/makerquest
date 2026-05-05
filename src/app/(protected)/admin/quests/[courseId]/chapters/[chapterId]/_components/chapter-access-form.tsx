'use client'

import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Chapter } from '@/generated/client'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
} from '@/components/ui/form'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { updateChapter } from '../_actions/udate-chapter'
interface ChapterAccessFormProps {
  initialData: Chapter
  courseId: string
  chapterId: string
}

const formSchema = z.object({
  isFree: z.boolean(),
})

export const ChapterAccessForm = ({
  initialData,
  courseId,
  chapterId,
}: ChapterAccessFormProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { isFree: !!initialData.isFree },
  })

  const { isSubmitting, isValid } = form.formState

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const result = await updateChapter(courseId, chapterId, values)
    if (!result.success) return toast.error(result.error)
    toast.success('Kapitel erfolgreich bearbeitet')
    setIsEditing(false)
    router.refresh()
  }

  return (
    <div className="mt-6 bg-muted rounded-md p-4 panel">
      <div className="font-medium flex items-center justify-between">
        Kapitel Verfügbarkeit
        <Button onClick={() => setIsEditing((c) => !c)} variant="ghost">
          {isEditing ? (
            <>Cancel</>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Verfügbarkeit bearbeiten
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <div
          className={cn(
            'text-sm mt-2',
            !initialData.isFree && 'text-muted-foreground italic',
          )}
        >
          {initialData.isFree
            ? 'Dieses Kapitel ist einsehbar ohne Anmeldung'
            : 'Dieses Kapitel ist nur mit Anmeldung verfügbar'}
        </div>
      )}
      {isEditing && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="isFree"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormDescription>
                      Box anticken, wenn das Kapitel als Vorschau verfügbar sein
                      soll.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <div className="flex items-center gap-x-2">
              <Button disabled={!isValid || isSubmitting} type="submit">
                Speichern
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  )
}
