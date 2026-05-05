'use client'

import * as React from 'react'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Pencil, X } from 'lucide-react'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Course } from '@/generated/client'

import { cn } from '@/lib/utils'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { Command, CommandGroup, CommandItem } from '@/components/ui/command'
import { Command as CommandPrimitive } from 'cmdk'
import { toast } from 'sonner'
import { updateCourseCategories } from '../_actions/update-categories'
import { createCategory } from '../_actions/create-category'
import { courseFormBlockClass } from './course-form-styles'

type Option = { label: string; value: string }

interface Category {
  id: string
  name: string
}

interface CategoryFormProps {
  initialData: Course & { categories: Category[] }
  courseId: string
  options: Option[]
}

const formSchema = z.object({
  categories: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    }),
  ),
})

export const CategoryForm = ({
  initialData,
  courseId,
  options,
}: CategoryFormProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [allOptions, setAllOptions] = useState<Option[]>(options)
  const [isPending, startTransition] = useTransition()

  const inputRef = React.useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Option[]>(
    initialData.categories.map((category) => ({
      label: category.name,
      value: category.id,
    })),
  )
  const [inputValue, setInputValue] = useState('')

  const handleUnselect = React.useCallback((option: Option) => {
    setSelected((prev) => prev.filter((s) => s.value !== option.value))
  }, [])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current
      if (input) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (input.value === '') {
            setSelected((prev) => prev.slice(0, -1))
          }
        }
        if (e.key === 'Escape') {
          input.blur()
        }
      }
    },
    [],
  )

  const selectables = allOptions.filter(
    (option) => !selected.some((sel) => sel.value === option.value),
  )

  const toggleEdit = () => setIsEditing((current) => !current)

  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categories: initialData.categories,
    },
  })

  const { isSubmitting } = form.formState

  const onSubmit = async (_values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      const categories = selected.map((option) => ({
        id: option.value,
        name: option.label,
      }))

      const result = await updateCourseCategories(courseId, categories)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Projekt aktualisiert')
        toggleEdit()
        router.refresh()
      }
    })
  }

  const handleNewCategorySubmit = async (trimmedValue: string) => {
    startTransition(async () => {
      const result = await createCategory(trimmedValue)

      if (result.error) {
        toast.error(result.error)
      } else if (result.data) {
        toast.success('Neue Kategorie erstellt')
        const newCategory: Option = {
          label: trimmedValue,
          value: result.data.id,
        }
        setAllOptions((prev) => [...prev, newCategory])
        setSelected((prev) => [...prev, newCategory])
      }

      setInputValue('')
    })
  }

  return (
    <div className={courseFormBlockClass}>
      <div className="font-medium flex items-center justify-between mb-8">
        Projekt Themen
        <Button onClick={toggleEdit} variant="outline" size="sm">
          {isEditing ? (
            <>Cancel</>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Themen wählen
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <p
          className={cn(
            'text-sm mt-2',
            !initialData.categories?.length && 'text-slate-500 italic',
          )}
        >
          {initialData.categories
            ?.map((category) => {
              const option = options.find((opt) => opt.value === category.id)
              return option ? option.label : null
            })
            .filter((label): label is string => label !== null)
            .join(', ') || 'Keine Kategorie'}
        </p>
      )}
      {isEditing && (
        <div>
          <div className="text-xs text-muted-foreground mt-4">
            Wählen Sie eine Kategorie für das Projekt
          </div>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 mt-4"
            >
              <FormField
                control={form.control}
                name="categories"
                render={() => (
                  <FormItem>
                    <FormControl>
                      <Command
                        onKeyDown={handleKeyDown}
                        className="overflow-visible bg-transparent"
                      >
                        <div className="bg-white group border border-input px-3 py-3 text-sm ring-offset-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                          <div className="flex gap-1 flex-wrap">
                            {selected.map((option) => (
                              <Badge key={option.value} variant="secondary">
                                {option.label}
                                <button
                                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleUnselect(option)
                                    }
                                  }}
                                  onMouseDown={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                  }}
                                  onClick={() => handleUnselect(option)}
                                >
                                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                </button>
                              </Badge>
                            ))}
                            <CommandPrimitive.Input
                              ref={inputRef}
                              value={inputValue}
                              onValueChange={setInputValue}
                              onBlur={() => setOpen(false)}
                              onFocus={() => setOpen(true)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  const trimmedValue = inputValue.trim()
                                  if (trimmedValue !== '') {
                                    handleNewCategorySubmit(trimmedValue)
                                  }
                                }
                              }}
                              placeholder="Kategorien wählen oder neue Kategorie erstellen und mit Enter bestätigen..."
                              className="ml-2 bg-transparent outline-none placeholder:text-muted-foreground flex-1"
                            />
                          </div>
                        </div>
                        <div className="relative mt-2">
                          {open && selectables.length > 0 && (
                            <div className="absolute w-full z-10 top-0 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                              <CommandGroup className="h-full overflow-auto">
                                {selectables.map((option) => (
                                  <CommandItem
                                    key={option.value}
                                    onMouseDown={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                    }}
                                    onSelect={() => {
                                      setInputValue('')
                                      setSelected((prev) => [...prev, option])
                                    }}
                                    className="cursor-pointer"
                                  >
                                    {option.label}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </div>
                          )}
                        </div>
                      </Command>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center gap-x-2">
                <Button disabled={isPending || isSubmitting} type="submit">
                  Speichern
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}
    </div>
  )
}
