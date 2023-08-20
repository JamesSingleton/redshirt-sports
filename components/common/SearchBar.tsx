'use client'
import { useRef } from 'react'
import { Search } from 'lucide-react'
import { usePlausible } from 'next-plausible'

const SearchBar = () => {
  const inputRef = useRef<HTMLInputElement>(null)
  const plausible = usePlausible()

  const searchArticles = () => {
    if (inputRef.current !== null && inputRef.current.value.length > 0) {
      plausible('Search', { props: { query: inputRef.current.value } })
    }
  }

  return (
    <form
      className="flex flex-1 items-center justify-center px-2 lg:ml-6 lg:justify-end"
      action="/search"
      role="search"
      onSubmit={() => searchArticles()}
    >
      <div className="w-full max-w-lg lg:max-w-xs">
        <label htmlFor="search" className="sr-only">
          Search
        </label>
        <div className="relative text-muted-foreground">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5" aria-hidden="true" />
          </div>
          <input
            ref={inputRef}
            id="search"
            name="q"
            className="placeholder-text-muted-foreground block w-full rounded-md border border-border bg-muted py-2 pl-10 pr-3 leading-5 focus:border-brand-500 focus:placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
            placeholder="Search Redshirt Sports..."
            type="search"
          />
        </div>
      </div>
    </form>
  )
}

export default SearchBar
