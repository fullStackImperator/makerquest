'use client'

import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import {
  Form,
  FormControl,
  FormField,
  FormLabel,
  FormMessage,
  FormItem,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { toast } from 'sonner'
import { addCourse } from './_actions/add-course'

const formSchema = z.object({
  title: z.string().min(1, {
    message: 'Titel ist erforderlich',
  }),
})

const CreatePage = () => {
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
    },
  })

  const { isSubmitting, isValid } = form.formState

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const result = await addCourse(values)
    if (!result.success) return toast.error(result.error)
    toast.success('Quest erstellt')
    router.push(`/admin/quests/${result.id}`)
  }

  return (
    <div className="max-w-5xl mx-auto flex md:items-center md:justify-center h-full p-6">
      <div>
        <h1 className="text-2xl">Geben Sie ein Questtitel an</h1>
        <p className="text-sm text-slate-600">
          Wie möchten Sie den Quest nennen? Keine Sorge, Sie können den Titel
          später anpassen.
        </p>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8 mt-8"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quest Titel</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="z.B. 'Pokemon aus dem 3D Drucker'"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-x-2">
              <Link href="/admin/quests">
                <Button type="button" variant="ghost">
                  Zurück
                </Button>
              </Link>
              <Button type="submit" disabled={!isValid || isSubmitting}>
                Weiter
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}

export default CreatePage
