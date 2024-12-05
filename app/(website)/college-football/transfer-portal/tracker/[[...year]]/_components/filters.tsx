'use client'
import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filter } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const divisions = ['All', 'FBS', 'FCS', 'D2', 'D3', 'NAIA']
const years = ['All', '2025']
const statuses = ['All', 'Entered', 'Withdrawn', 'Committed']
const schools = ['All', 'Springfield U', 'Oakville College', 'Rivertown State']

interface FiltersProps {
  positions: {
    id: number
    name: string
    abbreviation: string
  }[]
  searchParams: { [key: string]: string | string[] | undefined }
}

export function Filters({ positions, searchParams }: FiltersProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const router = useRouter()
  const currentSearchParams = useSearchParams()

  const handleFilterChange = (key: string, value: string) => {
    const newSearchParams = new URLSearchParams(currentSearchParams.toString())
    if (value && value !== 'All') {
      newSearchParams.set(key, value)
    } else {
      newSearchParams.delete(key)
    }
    router.push(`?${newSearchParams.toString()}`)
  }

  const FilterSelect = ({
    label,
    paramKey,
    options,
  }: {
    label: string
    paramKey: string
    options: string[]
  }) => (
    <div className="w-full">
      <Label htmlFor={label} className="mb-2 block text-sm font-medium">
        {label}
      </Label>
      <Select
        value={(searchParams[paramKey] as string) || 'All'}
        onValueChange={(value) => handleFilterChange(paramKey, value)}
      >
        <SelectTrigger id={label} className="w-full">
          <SelectValue placeholder={`Select ${label}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  const AdditionalFilters = () => (
    <>
      <FilterSelect label="Division" paramKey="division" options={divisions} />
      <FilterSelect label="School" paramKey="school" options={schools} />
      <FilterSelect label="Year" paramKey="year" options={years} />
      <FilterSelect label="Status" paramKey="status" options={statuses} />
    </>
  )

  return (
    <div className="mb-6">
      <div className="hidden gap-4 md:grid md:grid-cols-5">
        <FilterSelect
          label="Position"
          paramKey="position"
          options={['All', ...positions.map((position) => position.abbreviation)]}
        />
        <AdditionalFilters />
      </div>
      <div className="flex flex-col space-y-4 md:hidden">
        <div className="flex items-end justify-between">
          <div className="w-1/2 pr-2">
            <FilterSelect
              label="Position"
              paramKey="position"
              options={['All', ...positions.map((position) => position.abbreviation)]}
            />
          </div>
          <div className="flex w-1/2 justify-end pl-2">
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline">
                  <Filter className="size-4" />
                  <span className="sr-only">More Filters</span>
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Filters</DrawerTitle>
                </DrawerHeader>
                <div className="space-y-4 p-4">
                  <AdditionalFilters />
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </div>
    </div>
  )
}
