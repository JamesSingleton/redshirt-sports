'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Input } from '@workspace/ui/components/input'
import { Button } from '@workspace/ui/components/button'
import { Card } from '@workspace/ui/components/card'

import { useDebounce } from '@/hooks/use-debounce'
import { client } from '@/lib/sanity/client'

interface SearchResult {
  _id: string
  _type: string
  title: string
  slug: string
  publishedAt: string
}

interface SearchBarProps {
  placeholder?: string
  className?: string
}

export const postsSearchQuery = /* groq */ `
*[_type == 'post' && (
  title match "*" + $q + "*" ||
  excerpt match "*" + $q + "*" ||
  pt::text(body) match "*" + $q + "*" ||
  authors[]->name match "*" + $q + "*" ||
  conferences[]->name match "*" + $q + "*"
)] | score(
  boost(title match "*" + $q + "*", 5),
  boost(excerpt match "*" + $q + "*", 3),
  boost(pt::text(body) match "*" + $q + "*", 2),
) | order(_score desc, publishedAt desc)[0...5]{
  _id,
  title,
  _score,
  "slug": slug.current,
  publishedAt,
  excerpt
}`

const realSearch = async (query: string): Promise<any> => {
  if (!query.trim()) return []

  try {
    const results = await client.fetch(postsSearchQuery, { q: query })

    return results
  } catch (error) {
    console.error('Search error:', error)
    return []
  }
}

export function SearchBar({ placeholder = 'Search...', className }: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [showResults, setShowResults] = React.useState(false)
  const [selectedIndex, setSelectedIndex] = React.useState(-1)

  const debouncedQuery = useDebounce(query, 300)
  const searchRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (debouncedQuery.trim()) {
      setIsLoading(true)
      realSearch(debouncedQuery)
        .then(setResults)
        .finally(() => setIsLoading(false))
    } else {
      setResults([])
    }
  }, [debouncedQuery])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setShowResults(false)
      inputRef.current?.blur()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && results[selectedIndex]) {
          const result = results[selectedIndex]
          router.push(`/${result.slug}`)
          setShowResults(false)
          inputRef.current?.blur()
        } else {
          handleSubmit(e)
        }
        break
      case 'Escape':
        setShowResults(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const handleResultClick = (result: SearchResult) => {
    router.push(`/${result.slug}`)
    setShowResults(false)
    setQuery('')
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setShowResults(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          onKeyDown={handleKeyDown}
          className="pr-10 pl-10 text-sm md:text-base"
          autoComplete="off"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2"
            onClick={clearSearch}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </form>

      {showResults && (query.trim() || results.length > 0) && (
        <Card className="absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden shadow-lg">
          {isLoading ? (
            <div className="text-muted-foreground p-4 text-center text-sm">Searching...</div>
          ) : results.length > 0 ? (
            <div className="flex max-h-[400px] flex-col md:max-h-[500px]">
              <div className="flex-1 overflow-y-auto">
                {results.map((result, index) => (
                  <button
                    key={result._id}
                    className={`hover:bg-muted border-border w-full border-b px-4 py-3 text-left transition-colors last:border-b-0 ${
                      index === selectedIndex ? 'bg-muted' : ''
                    }`}
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex flex-col">
                      <div className="line-clamp-2 text-sm font-medium">{result.title}</div>
                    </div>
                  </button>
                ))}
              </div>

              {query.trim() && (
                <div className="border-border bg-background border-t">
                  <button
                    className="hover:bg-muted text-muted-foreground w-full px-4 py-3 text-left text-sm transition-colors"
                    onClick={handleSubmit}
                  >
                    <div className="flex items-center gap-3">
                      <Search className="h-4 w-4" />
                      <span>Search for &quot;{query}&quot;</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          ) : query.trim() ? (
            <div className="text-muted-foreground p-4 text-center text-sm">
              No articles found for &quot;{query}&quot;
            </div>
          ) : null}
        </Card>
      )}
    </div>
  )
}
