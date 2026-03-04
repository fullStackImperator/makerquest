// components/SchwierigkeitFilter.tsx
'use client'

import { useEffect, useState } from 'react'// Import the enum from where you've defined it
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
import { DifficultyLevel } from '@/generated/enums'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// Create a mapping from DifficultyLevel to display strings
const difficultyLabels: Record<DifficultyLevel, string> = {
  VERY_EASY: 'Sehr einfach',
  EASY: 'Einfach',
  MEDIUM: 'Mittel',
  DIFFICULT: 'Schwierig',
  VERY_DIFFICULT: 'Sehr schwierig',
}

interface SchwierigkeitFilterProps {
  schwierigkeiten: DifficultyLevel[]
  currentSchwierigkeit: DifficultyLevel | null
  onSchwierigkeitChange: (id: DifficultyLevel | null) => void
  reset: boolean // Add this prop
}

export const SchwierigkeitFilter = ({
  schwierigkeiten,
  currentSchwierigkeit,
  onSchwierigkeitChange,
  reset
}: SchwierigkeitFilterProps) => {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState<DifficultyLevel | ''>(currentSchwierigkeit || '')


  useEffect(() => {
    if (reset) {
      setValue('')
      onSchwierigkeitChange(null)
    }
  }, [reset, onSchwierigkeitChange])



  const onSelectSchwierigkeit = (id: DifficultyLevel) => {
    const isSelected = currentSchwierigkeit === id

    setValue(isSelected ? '' : id)
    onSchwierigkeitChange(isSelected ? null : id)
    setOpen(false)
  }


console.log('reset: ', reset)
console.log('value: ', value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between mr-4"
        >
          {/* {value ? DifficultyLevel[value] : 'Schwierigkeit filtern...'} */}
          {value ? difficultyLabels[value] : 'Schwierigkeit filtern...'}

          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput placeholder="Search schwierigkeit..." />
          <CommandList>
            <CommandEmpty>Kein Filter gewählt.</CommandEmpty>
            <CommandGroup>
              {Object.values(DifficultyLevel).map((level) => (
                <CommandItem
                  key={level}
                  value={level}
                  onSelect={() => onSelectSchwierigkeit(level)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      currentSchwierigkeit === level
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                  {/* {DifficultyLevel[level]} */}
                  {difficultyLabels[level]}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
