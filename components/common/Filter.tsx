import { Check, PlusCircle } from 'lucide-react'

import { cn } from '@lib/utils'
import { Button } from '@components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@components/ui/popover'

interface FilterProps {
  title: string
  options?: any
}

export function Filter({ title, options }: FilterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircle className="mr-2 h-4 w-4" />
          {title}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options &&
                options.map((option: any) => {
                  const isSelected = false
                  return (
                    <CommandItem key={option.value}>
                      <div
                        className={cn(
                          'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'opacity-50 [&_svg]:invisible',
                        )}
                      >
                        <Check className={cn('h-4 w-4')} />
                      </div>
                      <span>{option.title}</span>
                    </CommandItem>
                  )
                })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
