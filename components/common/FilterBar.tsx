'use client'

import { X } from 'lucide-react'

import { Button, Input } from '@components/ui'
import { Filter } from './Filter'

export function FilterBar() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Filter title="Position" />
        <Filter title="Status" />
      </div>
    </div>
  )
}
