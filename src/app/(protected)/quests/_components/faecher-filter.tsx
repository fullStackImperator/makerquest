'use client'

import { useEffect, useState } from 'react'
import { Fach } from '@/generated/client'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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

interface FachProps {
  faecher: Fach[]
  currentFachId: string | null
  onFachChange: (id: string) => void
  reset: boolean
}

export const Faecher = ({
  faecher,
  currentFachId,
  onFachChange,
  reset,
}: FachProps) => {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(currentFachId || '')

  const onSelectFach = (id: string) => {
    const isSelected = currentFachId === id

    setValue(isSelected ? '' : id)
    onFachChange(isSelected ? '' : id)
    setOpen(false)
  }

  useEffect(() => {
    if (reset) {
      setValue('')
      onFachChange('')
    }
  }, [reset, onFachChange])

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
            ? faecher.find((fach) => fach.id === value)?.name
            : 'Fach filtern...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput placeholder="Search Fach..." />
          <CommandList>
            <CommandEmpty>Kein Fach gewählt.</CommandEmpty>
            <CommandGroup>
              {faecher.map((fach) => (
                <CommandItem
                  key={fach.id}
                  value={fach.id}
                  onSelect={() => onSelectFach(fach.id)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      currentFachId === fach.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {fach.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
