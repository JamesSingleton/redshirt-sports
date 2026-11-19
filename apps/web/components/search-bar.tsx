"use client";

import { client } from "@redshirt-sports/sanity/client";
import { postsSearchQuery } from "@redshirt-sports/sanity/queries";
import {
  Autocomplete,
  AutocompleteClear,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  useAsyncOptions,
} from "@redshirt-sports/ui/components/autocomplete";
import { cn } from "@redshirt-sports/ui/lib/utils";
import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SearchResult {
  _id: string;
  title: string;
  slug: string;
}

interface SearchBarProps {
  placeholder?: string;
  className?: string;
}

async function searchPosts(query: string): Promise<SearchResult[]> {
  try {
    return (await client.fetch(postsSearchQuery, { q: query })) ?? [];
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

function searchHref(query: string) {
  return `/search?q=${encodeURIComponent(query)}`;
}

/** Suggests articles as someone types; Enter searches for the text. */
export function SearchBar({
  placeholder = "Search...",
  className,
}: SearchBarProps) {
  const router = useRouter();
  const [text, setText] = useState("");
  const results = useAsyncOptions<SearchResult>(
    (query) => searchPosts(query.trim()),
    { debounce: 300, minLength: 1 },
  );
  const query = text.trim();

  function reset() {
    setText("");
    results.setQuery("");
  }

  return (
    <form
      role="search"
      className={cn("relative", className)}
      onSubmit={(event) => event.preventDefault()}
    >
      <Autocomplete
        value={text}
        onValueChange={(next, details) => {
          // Choosing a suggestion opens its article, so the field starts over.
          if (details.reason === "item-press") {
            reset();
            return;
          }
          setText(next);
          results.setQuery(next.trim() ? next : "");
        }}
        filter={false}
        status={results.status}
        onSubmit={(value) => {
          const trimmed = value.trim();
          if (trimmed) router.push(searchHref(trimmed));
        }}
      >
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <AutocompleteInput
          type="search"
          aria-label="Search articles"
          placeholder={placeholder}
          className="pr-9 pl-9"
        />
        <AutocompleteClear className="absolute top-1/2 right-1.5 -translate-y-1/2" />
        <AutocompleteContent className="w-[min(28rem,calc(100vw-2rem))]">
          <AutocompleteEmpty>
            {(state) =>
              state.loading
                ? "Searching…"
                : state.empty && query
                  ? `No articles found for “${query}”`
                  : null
            }
          </AutocompleteEmpty>
          <AutocompleteList>
            {results.items.map((result) => (
              <AutocompleteItem
                key={result._id}
                value={result.slug}
                label={result.title}
                render={<Link href={`/${result.slug}`} prefetch={false} />}
              >
                <span className="line-clamp-2 font-medium">{result.title}</span>
              </AutocompleteItem>
            ))}
          </AutocompleteList>
          {query ? (
            <Link
              href={searchHref(query)}
              prefetch={false}
              className="flex items-center gap-3 border-t px-4 py-3 text-sm text-muted-foreground hover:bg-muted"
            >
              <Search className="size-4" aria-hidden />
              Search for “{query}”
            </Link>
          ) : null}
        </AutocompleteContent>
      </Autocomplete>
    </form>
  );
}
