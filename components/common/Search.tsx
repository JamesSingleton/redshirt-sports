'use client'

import { useCallback, useState, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import debounce from 'lodash.debounce'

import { Input } from '@components/ui'

export default function Search() {
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  const debouncedSearch = debounce((value: string) => {
    if (value) {
      router.push(`/search?q=${encodeURIComponent(value)}`)
    } else {
      router.push(`/search`)
    }
  }, 500)

  const handleSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target
      setSearchTerm(value)
      debouncedSearch(value)
    },
    [debouncedSearch],
  )

  return (
    <Input type="search" value={searchTerm} onChange={handleSearchChange} placeholder="Search..." />
  )
}
