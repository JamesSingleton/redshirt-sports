import type { QueryPostSlugDataResult } from "@redshirt-sports/sanity/types";
import type { Route } from "next";
import Link from "next/link";

import CustomImage from "../sanity-image";

type PostAuthor = NonNullable<QueryPostSlugDataResult>["authors"][0];

export function Byline({ authors }: { authors: PostAuthor[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-3">
      {authors?.map((author) => (
        <li key={author._id} className="flex items-center gap-3">
          <CustomImage
            image={author.image}
            className="size-9 rounded-full object-cover"
            width={36}
            height={36}
            mode="cover"
          />
          <div className="flex flex-col">
            {author.archived ? (
              <span className="text-sm font-semibold">{author.name}</span>
            ) : (
              <Link
                href={`/authors/${author.slug}` as Route}
                prefetch={false}
                className="hover:text-primary text-sm font-semibold"
              >
                {author.name}
              </Link>
            )}
            {author.roles.length > 0 ? (
              <span className="text-muted-foreground text-xs">
                {author.roles.join(", ")}
              </span>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
