'use client'

import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Course } from '@/generated/client'
import { updateCourse } from '../_actions/update-course'

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
import { courseFormBlockClass } from './course-form-styles'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'

interface DescriptionFormProps {
  initialData: Course
  courseId: string
}

const formSchema = z.object({
  description: z
    .string()
    .min(1, { message: 'Beschreibung ist notwendig' })
    .refine((val) => val.trim().split(/\s+/).length <= 20, {
      message: 'Die Kurzeschreibung darf höchstens 20 Wörter enthalten',
    }),
})

export const DescriptionForm = ({
  initialData,
  courseId,
}: DescriptionFormProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const toggleEdit = () => setIsEditing((current) => !current)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: initialData?.description || '',
    },
  })

  const { isSubmitting, isValid } = form.formState

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const result = await updateCourse(courseId, {
      description: values.description,
    })
    if (!result.success) return toast.error(result.error)
    toast.success('Projekt aktualisiert')
    toggleEdit()
    router.refresh()
  }

  return (
    <div className={courseFormBlockClass}>
      <div className="font-medium flex items-center justify-between mb-8 pr-2">
        Untertitel (max 20 Wörter)
        <Button onClick={toggleEdit} variant="outline" size="sm">
          {isEditing ? (
            <>Cancel</>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Untertitel bearbeiten
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <p
          className={cn(
            'text-sm mt-2',
            !initialData.description && 'text-slate-500 italic',
          )}
        >
          {initialData.description || 'Keine Beschreibung'}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      disabled={isSubmitting}
                      placeholder="e.g. 'Dieser Kurs ist ein 3D Drucker makerspace Projekt'"
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
