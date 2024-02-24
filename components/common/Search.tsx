'use client'

import { useCallback, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import debounce from 'lodash.debounce'

import { Input } from '@components/ui/input'

export default function Search({ defaultValue = '' }) {
  const router = useRouter()

  const debouncedSearch = debounce((value: string) => {
    router.push(`/search${value ? `?q=${encodeURIComponent(value)}` : ''}`)
  }, 500)

  const handleSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target
      debouncedSearch(value)
    },
    [debouncedSearch],
  )

  return (
    <Input
      type="search"
      defaultValue={defaultValue}
      onChange={handleSearchChange}
      placeholder="Search Redshirt Sports..."
    />
  )
}
