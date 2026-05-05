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
import { Check, ChevronsUpDown, Pencil } from 'lucide-react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const klassenstufen = Array.from({ length: 9 }, (_, i) => i + 5)

interface KlassenstufeFormProps {
  initialData: Course
  courseId: string
}

const formSchema = z.object({
  klassenstufe: z.number().int().min(5).max(13),
})

export const KlassenstufeForm = ({
  initialData,
  courseId,
}: KlassenstufeFormProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [open, setOpen] = useState(false)

  const toggleEdit = () => setIsEditing((current) => !current)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      klassenstufe: initialData?.klassenstufe ?? undefined,
    },
  })

  const { isSubmitting, isValid } = form.formState

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const result = await updateCourse(courseId, {
      klassenstufe: values.klassenstufe,
    })
    if (!result.success) return toast.error(result.error)
    toast.success('Projekt aktualisiert')
    toggleEdit()
    router.refresh()
  }

  return (
    <div className={courseFormBlockClass}>
      <div className="font-medium flex items-center justify-between mb-8">
        Empfohlene Klassenstufe
        <Button onClick={toggleEdit} variant="outline" size="sm">
          {isEditing ? (
            <>Cancel</>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Klassenstufe bearbeiten
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <p
          className={cn(
            'text-sm mt-2',
            !initialData.klassenstufe && 'text-slate-500 italic',
          )}
        >
          {initialData.klassenstufe
            ? `Empfohlene Klassenstufe: ${initialData.klassenstufe}`
            : 'Keine Klassenstufe'}
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
              name="klassenstufe"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className={cn(
                            'justify-between',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {field.value
                            ? `Klasse ${field.value}`
                            : 'Klassenstufe wählen...'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0">
                        <Command>
                          <CommandInput
                            placeholder="Suche..."
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty>
                              Kein Schwierigkeitsgrad ausgewählt.
                            </CommandEmpty>
                            <CommandGroup>
                              {klassenstufen.map((stufe) => (
                                <CommandItem
                                  key={stufe}
                                  value={stufe.toString()}
                                  onSelect={() => {
                                    field.onChange(stufe)
                                    setOpen(false)
                                  }}
                                >
                                  Klasse {stufe}
                                  <Check
                                    className={cn(
                                      'ml-auto h-4 w-4',
                                      field.value === stufe
                                        ? 'opacity-100'
                                        : 'opacity-0',
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
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
