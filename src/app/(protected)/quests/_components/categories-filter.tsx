'use client'

import { useEffect, useState } from 'react'
import { Category } from '@/generated/client'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface CategoriesProps {
  categories: Category[]
  currentCategoryId: string | null
  onCategoryChange: (id: string) => void
  reset: boolean // Add this prop
}

export const Categories = ({
  categories,
  currentCategoryId,
  onCategoryChange,
  reset,
}: CategoriesProps) => {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(currentCategoryId || '')

  const onSelectCategory = (id: string) => {
    const isSelected = currentCategoryId === id

    setValue(isSelected ? '' : id)
    onCategoryChange(isSelected ? '' : id)
    setOpen(false)
  }

  useEffect(() => {
    if (reset) {
      setValue('')
      onCategoryChange('')
    }
  }, [reset, onCategoryChange])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between mr-4"
        >
          {value
            ? categories.find((category) => category.id === value)?.name
            : 'Themen filtern...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          {/* <CommandInput placeholder="Search category..." /> */}
          <CommandList>
            <CommandEmpty>Kein Thema gewählt.</CommandEmpty>
            <CommandGroup>
              {categories.map((category) => (
                <CommandItem
                  key={category.id}
                  value={category.id}
                  onSelect={() => onSelectCategory(category.id)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      currentCategoryId === category.id
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                  {category.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
