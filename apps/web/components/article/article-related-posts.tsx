import Link from "next/link";

import CustomImage, { IMAGE_SIZES } from "@/components/sanity-image";
import type { ArticleRelatedPost } from "@/lib/article-related";

export function ArticleRelatedPosts({
  posts,
}: {
  posts: ArticleRelatedPost[];
}) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <section
      className="mx-auto mt-12 max-w-prose border-t pt-8"
      aria-label="Articles you might also like"
    >
      <h2 className="font-display text-xl font-bold uppercase tracking-wide">
        Articles you might also like
      </h2>
      <ul className="mt-4 grid gap-4">
        {posts.map((post) => (
          <li key={post._id}>
            <Link
              href={`/${post.slug}`}
              prefetch={false}
              className="grid grid-cols-[1fr_6rem] gap-4 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:grid-cols-[1fr_8rem]"
            >
              <div className="min-w-0">
                <div className="kicker text-primary">{post.kicker}</div>
                <span className="font-display text-lg font-bold leading-snug hover:underline">
                  {post.title}
                </span>
              </div>
              {post.image ? (
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                  <CustomImage
                    image={post.image}
                    width={128}
                    height={96}
                    className="h-full w-full object-cover"
                    mode="cover"
                    sizes={IMAGE_SIZES.articleCard}
                  />
                </div>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
