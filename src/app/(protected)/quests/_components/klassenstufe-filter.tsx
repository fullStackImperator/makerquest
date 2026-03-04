// components/KlassenstufeFilter.tsx
'use client'

import { useEffect, useState } from 'react'
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
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KlassenstufeFilterProps {
  klassenstufen: number[]
  currentKlassenstufe: number | null
  onKlassenstufeChange: (id: number) => void
  reset: boolean // Add this prop
}

export const KlassenstufeFilter = ({
  klassenstufen,
  currentKlassenstufe,
  onKlassenstufeChange,
  reset,
}: KlassenstufeFilterProps) => {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(currentKlassenstufe || '')

  const onSelectKlassenstufe = (id: number) => {
    const isSelected = currentKlassenstufe === id

    setValue(isSelected ? '' : id)
    onKlassenstufeChange(isSelected ? 0 : id)
    setOpen(false)
  }

  useEffect(() => {
    if (reset) {
      setValue('')
      onKlassenstufeChange(0)
    }
  }, [reset, onKlassenstufeChange])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between mr-4"
        >
          {/* {value ? `Klassenstufe ${value}` : 'Klassenstufe filtern...'} */}
          {value
            ? 'Klasse ' +
              klassenstufen.find((klassenstufe) => klassenstufe === value)
            : 'Klassenstufe filtern...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          {/* <CommandInput placeholder="Search klassenstufe..." /> */}
          <CommandList>
            <CommandEmpty>Keine Klassenstufe gewählt.</CommandEmpty>
            <CommandGroup>
              {klassenstufen.map((klassenstufe) => (
                <CommandItem
                  key={klassenstufe}
                  value={klassenstufe.toString()}
                  onSelect={() => onSelectKlassenstufe(klassenstufe)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      currentKlassenstufe === klassenstufe
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                  Klasse {klassenstufe}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
