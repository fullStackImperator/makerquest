'use client'

import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

import { Course } from '@/generated/client'
import { updateCourse } from '../_actions/update-course'
import { courseFormBlockClass } from './course-form-styles'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Editor } from '@/components/quillEditor/editor'
import { Preview } from '@/components/quillEditor/previewQuill'

interface KompetenzenFormProps {
  initialData: Course
  courseId: string
}

const formSchema = z.object({
  kompetenzen: z.string().min(1, {
    message: 'Kompetenzen sind notwendig',
  }),
})

export const KompetenzenForm = ({
  initialData,
  courseId,
}: KompetenzenFormProps) => {
  const [isEditing, setIsEditing] = useState(false)

  const toggleEdit = () => setIsEditing((current) => !current)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      kompetenzen: initialData?.kompetenzen ?? '',
    },
  })

  const { isSubmitting, isValid } = form.formState

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const result = await updateCourse(courseId, {
      kompetenzen: values.kompetenzen,
    })
    if (!result.success) return toast.error(result.error)
    toast.success('Projekt aktualisiert')
    toggleEdit()
    router.refresh()
  }

  return (
    <div className={courseFormBlockClass}>
      <div className="font-medium flex items-center justify-between mb-4">
        Was wird gelernt
        <Button
          onClick={toggleEdit}
          variant="ghost"
          className="bg-green-200 hover:bg-green-600 hover:text-white"
        >
          {isEditing ? (
            <>Zurück</>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Was wird gelernt bearbeiten
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <div
          className={cn(
            'text-sm mt-2',
            !initialData.kompetenzen && 'text-slate-500 italic',
          )}
        >
          {!initialData.kompetenzen && 'Keine Beschreibung'}
          {initialData.kompetenzen && (
            <Preview value={initialData.kompetenzen} />
          )}
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
              name="kompetenzen"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Editor {...field} />
                  </FormControl>
                  <FormMessage />
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
