import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@redshirt-sports/ui/components/card";
import Link from "next/link";

import type { MostReadItem } from "@/lib/most-read-data";

export function MostReadCard({ items }: { items: MostReadItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Card className="gap-0 shadow-xs">
      <CardHeader className="flex items-start justify-between gap-2 px-5 pt-5">
        <div className="grid gap-1">
          <CardTitle className="font-display text-xl font-bold uppercase leading-none tracking-wide">
            Most read
          </CardTitle>
          <CardDescription>Past 24 hours</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-5 pt-2 pb-3">
        <ol className="grid gap-0">
          {items.map((item, index) => (
            <li
              key={item._id}
              className="flex gap-3 border-b py-2.5 last:border-0"
            >
              <span
                className="font-display text-2xl font-extrabold leading-none text-primary tabular"
                aria-hidden
              >
                {index + 1}
              </span>
              <Link
                href={`/${item.slug}`}
                className="text-sm font-semibold leading-snug hover:underline"
                prefetch={false}
              >
                {item.title}
              </Link>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
