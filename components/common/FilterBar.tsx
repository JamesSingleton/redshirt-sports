'use client'

import { X } from 'lucide-react'

import { Button, Input } from '@components/ui'

export function FilterBar() {
  const isFiltered = true
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input placeholder="Filter players..." className="h-8 w-[150px] lg:w-[250px]" />
        {isFiltered && (
          <Button variant="ghost" className="h-8 px-2 lg:px-3">
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
