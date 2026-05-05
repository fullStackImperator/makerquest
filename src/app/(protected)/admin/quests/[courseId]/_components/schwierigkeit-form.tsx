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
import { ChevronsUpDown, Check } from 'lucide-react'
import { Pencil } from 'lucide-react'
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

const schwierigkeiten = [
  { value: 'VERY_EASY', label: 'Sehr einfach' },
  { value: 'EASY', label: 'Einfach' },
  { value: 'MEDIUM', label: 'Mittel' },
  { value: 'DIFFICULT', label: 'Schwierig' },
  { value: 'VERY_DIFFICULT', label: 'Sehr Schwierig' },
] as const

type Schwierigkeit = (typeof schwierigkeiten)[number]['value']

interface SchwierigkeitsFormProps {
  initialData: Course
  courseId: string
}

const formSchema = z.object({
  schwierigkeit: z.enum([
    'VERY_EASY',
    'EASY',
    'MEDIUM',
    'DIFFICULT',
    'VERY_DIFFICULT',
  ]),
})

export const SchwierigkeitsForm = ({
  initialData,
  courseId,
}: SchwierigkeitsFormProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [open, setOpen] = useState(false)

  const toggleEdit = () => setIsEditing((current) => !current)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      schwierigkeit: (initialData?.schwierigkeit as Schwierigkeit) ?? undefined,
    },
  })

  const { isSubmitting, isValid } = form.formState

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const result = await updateCourse(courseId, {
      schwierigkeit: values.schwierigkeit,
    })
    if (!result.success) return toast.error(result.error)
    toast.success('Projekt aktualisiert')
    toggleEdit()
    router.refresh()
  }

  const initialLabel = schwierigkeiten.find(
    (s) => s.value === initialData.schwierigkeit,
  )?.label

  return (
    <div className={courseFormBlockClass}>
      <div className="font-medium flex items-center justify-between mb-8">
        Projekt Schwierigkeit
        <Button onClick={toggleEdit} variant="outline" size="sm">
          {isEditing ? (
            <>Cancel</>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Schwierigkeit bearbeiten
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <p
          className={cn(
            'text-sm mt-2',
            !initialData.schwierigkeit && 'text-slate-500 italic',
          )}
        >
          {initialData.schwierigkeit
            ? `Schwierigkeit: ${initialLabel}`
            : 'Keine Schwierigkeit gewählt'}
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
              name="schwierigkeit"
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
                            ? schwierigkeiten.find(
                                (s) => s.value === field.value,
                              )?.label
                            : 'Schwierigkeit wählen...'}
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
                              {schwierigkeiten.map((s) => (
                                <CommandItem
                                  key={s.value}
                                  value={s.value}
                                  onSelect={(currentValue) => {
                                    const match = schwierigkeiten.find(
                                      (s) =>
                                        s.value === currentValue.toUpperCase(),
                                    )
                                    if (match) {
                                      field.onChange(match.value)
                                    }
                                    setOpen(false)
                                  }}
                                >
                                  {s.label}
                                  <Check
                                    className={cn(
                                      'ml-auto h-4 w-4',
                                      field.value === s.value
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
