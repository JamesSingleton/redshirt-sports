"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import { Input } from "@redshirt-sports/ui/components/input";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export function TeamPlayerSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="ml-auto flex w-full max-w-xs items-center gap-0"
    >
      <Input
        type="search"
        name="q"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search players"
        className="rounded-r-none"
        autoComplete="off"
      />
      <Button
        type="submit"
        size="icon"
        className="shrink-0 rounded-l-none"
        aria-label="Search players"
      >
        <Search data-icon="inline-start" />
      </Button>
    </form>
  );
}
