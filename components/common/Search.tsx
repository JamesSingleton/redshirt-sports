'use client'

import { useCallback, useState, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import debounce from 'lodash.debounce'

import { Input } from '@components/ui'

export default function Search() {
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

  return <Input type="search" onChange={handleSearchChange} placeholder="Search..." />
}
