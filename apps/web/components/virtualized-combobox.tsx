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
import { cn } from '@workspace/ui/lib/utils'

import CustomImage from '@/components/sanity-image'

import type { SchoolsByDivisionQueryResult } from '@/lib/sanity/sanity.types'

interface VirtualizedCommandProps {
  height: string
  options: SchoolsByDivisionQueryResult
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
  const availableOptions = React.useMemo(
    () => options.filter((option) => !selectedOptions.includes(option._id)),
    [options, selectedOptions],
  )

  const [filteredOptions, setFilteredOptions] =
    React.useState<SchoolsByDivisionQueryResult>(availableOptions)
  const [searchValue, setSearchValue] = React.useState('')
  const parentRef = React.useRef(null)

  const fuse = React.useMemo(
    () =>
      new Fuse(availableOptions, {
        keys: ['name', 'shortName', 'abbreviation'],
      }),
    [availableOptions],
  )

  const virtualizer = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
    overscan: 5,
  })

  const virtualOptions = virtualizer.getVirtualItems()

  const handleSearch = React.useCallback(
    (search: string) => {
      setSearchValue(search)

      // If search is empty, show all available options
      if (!search || search.trim() === '') {
        setFilteredOptions(availableOptions)
        return
      }

      const searchResults = fuse.search(search).map((result) => result.item)
      setFilteredOptions(searchResults)
    },
    [availableOptions, fuse],
  )

  // Reset filtered options when options or selectedOptions change
  React.useEffect(() => {
    if (!searchValue) {
      setFilteredOptions(availableOptions)
    }
  }, [availableOptions, searchValue])

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
            {virtualOptions.map((virtualOption) => {
              const option = filteredOptions[virtualOption.index]
              if (!option) {
                return null
              }

              return (
                <CommandItem
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualOption.size}px`,
                    transform: `translateY(${virtualOption.start}px)`,
                  }}
                  key={option._id}
                  value={option._id}
                  onSelect={onSelectOption}
                >
                  <Check
                    className={cn(
                      'mr-2 size-4',
                      selectedOption === option._id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <div className="flex items-center">
                    <CustomImage
                      image={option.image}
                      width={32}
                      height={32}
                      className="mr-2 size-8"
                    />
                    {option.shortName}
                  </div>
                </CommandItem>
              )
            })}
          </div>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

interface VirtualizedComboboxProps {
  options: SchoolsByDivisionQueryResult
  searchPlaceholder?: string
  width?: string
  height?: string
  value?: string
  onChange?: (value: string) => void
  selectedOptions: string[]
}

export function VirtualizedCombobox({
  options,
  searchPlaceholder = 'Select a school...',
  // width = '350px',
  height = '400px',
  value,
  onChange,
  selectedOptions,
}: VirtualizedComboboxProps) {
  const [open, setOpen] = React.useState<boolean>(false)
  const [selectedOption, setSelectedOption] = React.useState<string>(value || '')
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const [triggerWidth, setTriggerWidth] = React.useState<number | undefined>(undefined)

  const availableOptions = React.useMemo(
    () => options.filter((option) => !selectedOptions.includes(option._id)),
    [options, selectedOptions],
  )

  const selectedSchool = React.useMemo(
    () => options.find((option) => option._id === selectedOption),
    [options, selectedOption],
  )

  // Sync internal state with external value
  React.useEffect(() => {
    setSelectedOption(value || '')
  }, [value])

  // Update trigger width when popover opens
  React.useEffect(() => {
    if (open && triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth)
    }
  }, [open])

  const handleSelectOption = React.useCallback(
    (currentValue: string) => {
      const newValue = currentValue === selectedOption ? '' : currentValue
      setSelectedOption(newValue)
      onChange?.(newValue)
      setOpen(false)
    },
    [selectedOption, onChange],
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedSchool?.image ? (
            <span className="inline-flex items-center">
              <CustomImage
                image={selectedSchool.image}
                width={32}
                height={32}
                className="mr-2 size-8"
              />
              {selectedSchool.shortName}
            </span>
          ) : (
            searchPlaceholder
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        style={{ width: triggerWidth ? `${triggerWidth}px` : '100%' }}
      >
        <VirtualizedCommand
          height={height}
          options={availableOptions}
          placeholder={searchPlaceholder}
          selectedOption={selectedOption}
          selectedOptions={selectedOptions}
          onSelectOption={handleSelectOption}
        />
      </PopoverContent>
    </Popover>
  )
}
