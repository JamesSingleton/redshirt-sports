import { Button } from "@redshirt-sports/ui/components/button";
import { Input } from "@redshirt-sports/ui/components/input";
import { Label } from "@redshirt-sports/ui/components/label";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { getMergeComparison } from "@/actions/portal";
import { MergeDesk } from "@/components/portal/duplicates";

type SearchParams = Promise<{ a?: string; b?: string }>;

const toId = (value: string | undefined) => {
  const id = Number(value?.trim().replace(/^#/, ""));
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

function CompareFallback() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="bg-muted h-9 w-64 max-w-full animate-pulse rounded" />
      <div className="bg-muted h-96 w-full animate-pulse rounded-xl" />
    </div>
  );
}

/** Asks for the second player when only one was given (from a player page). */
function PickSecond({ a }: { a: number }) {
  return (
    <form method="get" className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="a" value={a} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="compare-b">Other player's id</Label>
        <Input
          id="compare-b"
          name="b"
          inputMode="numeric"
          className="w-40"
          required
        />
      </div>
      <Button type="submit">Compare</Button>
    </form>
  );
}

async function CompareContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const a = toId(params.a);
  if (!a) notFound();
  const b = toId(params.b);
  const comparison = b ? await getMergeComparison(a, b) : null;
  if (b && !comparison) notFound();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <Link
          href="/portal/duplicates"
          className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase hover:underline"
        >
          Possible duplicates
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">
          Compare players
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Pick the player to keep: usually the one with the fuller history. In a
          sport both have, only the kept player's history stays on the site.
        </p>
      </div>
      {comparison ? (
        <MergeDesk comparison={comparison} />
      ) : (
        <PickSecond a={a} />
      )}
    </div>
  );
}

export default function ComparePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<CompareFallback />}>
      <CompareContent searchParams={searchParams} />
    </Suspense>
  );
}
