import { Check, PlusCircle } from 'lucide-react'

import { cn } from '@lib/utils'
import { Badge } from '@components/ui/Badge'
import { Button } from '@components/ui'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@components/ui/Command'
import { Popover, PopoverContent, PopoverTrigger } from '@components/ui/Popover'
import { Separator } from '@components/ui/Separator'

interface FilterProps {
  title: string
}

export function Filter({ title }: FilterProps) {
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
            <CommandGroup></CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
