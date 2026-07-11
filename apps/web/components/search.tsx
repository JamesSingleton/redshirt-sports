"use client";

import { analytics } from "@redshirt-sports/analytics";
import { Input } from "@redshirt-sports/ui/components/input";
import debounce from "lodash.debounce";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
} from "react";

export default function Search({ defaultValue = "" }) {
  const router = useRouter();
  const searchInputId = useId();

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        if (value) {
          analytics?.capture("search_performed", {
            search_query: value,
            query_length: value.length,
          });
        }
        router.push(`/search${value ? `?q=${encodeURIComponent(value)}` : ""}`);
      }, 500),
    [router],
  );

  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  const handleSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      debouncedSearch(value);
    },
    [debouncedSearch],
  );

  return (
    <form role="search">
      <label htmlFor={searchInputId} className="sr-only">
        Search articles
      </label>
      <Input
        id={searchInputId}
        type="search"
        defaultValue={defaultValue}
        onChange={handleSearchChange}
        placeholder={`Search ${process.env.NEXT_PUBLIC_APP_NAME}...`}
      />
    </form>
  );
}
