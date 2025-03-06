'use client'
import * as React from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Check, ChevronsUpDown } from 'lucide-react'
import Fuse from 'fuse.js'

import { Button } from '@workspace/ui/components/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@workspace/ui/components/command'
import { Popover, PopoverContent, PopoverTrigger } from '@workspace/ui/components/popover'
import { Image as SanityImage } from '@/components/image'
import { cn } from '@/lib/utils'
import { ImageAsset } from 'sanity'

type Option = {
  _id: string
  image: ImageAsset
  abbreviation: string
  name: string
  shortName: string
}

interface VirtualizedCommandProps {
  height: string
  options: Option[]
  placeholder: string
  selectedOption: string
  selectedOptions: string[]
  onSelectOption?: (option: string) => void
}

const VirtualizedCommand = ({
  height,
  options,
  placeholder,
  selectedOption,
  selectedOptions,
  onSelectOption,
}: VirtualizedCommandProps) => {
  const [filteredOptions, setFilteredOptions] = React.useState<Option[]>(
    options.filter((option) => !selectedOptions.includes(option._id)),
  )
  const parentRef = React.useRef(null)

  const virtualizer = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
    overscan: 5,
  })

  const virtualOptions = virtualizer.getVirtualItems()

  const handleSearch = (search: string) => {
    const fuse = new Fuse(
      options.filter((option) => !selectedOptions.includes(option._id)),
      {
        keys: ['name', 'shortName', 'abbreviation'],
      },
    )

    setFilteredOptions(fuse.search(search).map((result) => result.item))
  }

  return (
    <Command shouldFilter={false}>
      <CommandInput onValueChange={handleSearch} placeholder={placeholder} />
      <CommandList className="max-h-fit">
        <CommandEmpty>No school found.</CommandEmpty>
        <CommandGroup
          ref={parentRef}
          style={{
            height: height,
            width: '100%',
            overflow: 'auto',
          }}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualOptions.map((virtualOption) => (
              <CommandItem
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualOption.size}px`,
                  transform: `translateY(${virtualOption.start}px)`,
                }}
                key={filteredOptions[virtualOption.index]._id}
                value={filteredOptions[virtualOption.index]._id}
                onSelect={onSelectOption}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    selectedOption === filteredOptions[virtualOption.index]._id
                      ? 'opacity-100'
                      : 'opacity-0',
                  )}
                />
                <div className="flex items-center">
                  <SanityImage
                    src={filteredOptions[virtualOption.index].image as any}
                    width={32}
                    height={32}
                    priority={false}
                    className="mr-2 h-8 w-8"
                  />
                  {filteredOptions[virtualOption.index].shortName}
                </div>
              </CommandItem>
            ))}
          </div>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

interface VirtualizedComboboxProps {
  options: Option[]
  searchPlaceholder?: string
  width?: string
  height?: string
  onChange?: (value: string) => void
  selectedOptions: string[]
}

export function VirtualizedCombobox({
  options,
  searchPlaceholder = 'Select a school...',
  // width = '350px',
  height = '400px',
  onChange,
  selectedOptions,
}: VirtualizedComboboxProps) {
  const [open, setOpen] = React.useState<boolean>(false)
  const [selectedOption, setSelectedOption] = React.useState<string>('')

  const availableOptions = options.filter((option) => !selectedOptions.includes(option._id))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="justify-between">
          {options.find((option) => option._id === selectedOption)?.image ? (
            <span className="inline-flex items-center">
              <SanityImage
                src={options.find((option) => option._id === selectedOption)?.image as any}
                width={32}
                height={32}
                priority={false}
                className="mr-2 h-8 w-8"
              />
              {options.find((option) => option._id === selectedOption)?.shortName}
            </span>
          ) : (
            searchPlaceholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <VirtualizedCommand
          height={height}
          options={availableOptions}
          placeholder={searchPlaceholder}
          selectedOption={selectedOption}
          selectedOptions={selectedOptions}
          onSelectOption={(currentValue) => {
            setSelectedOption(currentValue === selectedOption ? '' : currentValue)
            onChange?.(currentValue)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
