'use client'

import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import type { Exercise } from '@/generated/client'
import { updateExercise } from '../_actions/update-exercise'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { toast } from 'sonner'

const schema = z.object({ title: z.string().min(1) })

export function ExerciseTitleForm({
  initialData,
  courseId,
  exerciseId,
}: {
  initialData: Exercise
  courseId: string
  exerciseId: string
}) {
  const router = useRouter()
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { title: initialData.title },
  })

  const onSubmit = async (values: z.infer<typeof schema>) => {
    const result = await updateExercise(courseId, exerciseId, {
      title: values.title,
    })
    if (result.success) {
      toast.success('Gespeichert')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="sm">
          Speichern
        </Button>
      </form>
    </Form>
  )
}
