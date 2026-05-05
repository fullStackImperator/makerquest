'use client'

import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Course } from '@/generated/client'
import { updateCourse } from '../_actions/update-course'
import { courseFormBlockClass } from './course-form-styles'

import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface VorkenntnisseFormProps {
  initialData: Course
  courseId: string
}

const formSchema = z.object({
  vorkenntnisse: z.string().min(1, {
    message: 'Benötigte Vorkenntnisse',
  }),
})

export const VorkenntnisseForm = ({
  initialData,
  courseId,
}: VorkenntnisseFormProps) => {
  const [isEditing, setIsEditing] = useState(false)

  const toggleEdit = () => setIsEditing((current) => !current)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vorkenntnisse: initialData?.vorkenntnisse ?? '',
    },
  })

  const { isSubmitting, isValid } = form.formState

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const result = await updateCourse(courseId, {
      vorkenntnisse: values.vorkenntnisse,
    })
    if (!result.success) return toast.error(result.error)
    toast.success('Projekt aktualisiert')
    toggleEdit()
    router.refresh()
  }

  return (
    <div className={courseFormBlockClass}>
      <div className="font-medium flex items-center justify-between mb-8">
        Benötigte Vorkenntnisse
        <Button onClick={toggleEdit} variant="outline" size="sm">
          {isEditing ? (
            <>Zurück</>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Vorkenntnisse bearbeiten
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <p
          className={cn(
            'text-sm mt-2',
            !initialData.vorkenntnisse && 'text-slate-500 italic',
          )}
        >
          {initialData.vorkenntnisse || 'Keine Vorkenntnisse benötigt'}
        </p>
      )}
      {isEditing && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="vorkenntnisse"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      disabled={isSubmitting}
                      placeholder="z.B. 'erste Erfahrungen mit Löten'"
                      {...field}
                    />
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
