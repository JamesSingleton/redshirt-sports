import { SearchIcon } from '@heroicons/react/solid'

const SearchBar = () => {
  return (
    <form
      className="flex flex-1 items-center justify-center px-2 lg:ml-6 lg:justify-end"
      action="/search"
      role="search"
    >
      <div className="w-full max-w-lg lg:max-w-xs">
        <label htmlFor="search" className="sr-only">
          Search
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
          </div>
          <input
            id="search"
            name="query"
            className="block w-full rounded-md border border-slate-300 bg-white py-2 pl-10 pr-3 leading-5 placeholder-slate-500 focus:border-brand-500 focus:placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
            placeholder="Search"
            type="search"
          />
        </div>
      </div>
    </form>
  )
}

export default SearchBar
