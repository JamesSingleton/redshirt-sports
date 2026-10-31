import { Button } from "@redshirt-sports/ui/components/button";
import { ListOrdered } from "lucide-react";
import Link from "next/link";

import { SiteBreadcrumb } from "@/components/chrome/site-breadcrumb";
import { SiteSocialButtons } from "@/components/contact/site-social-buttons";
import { ArchivePublishedTime } from "@/components/news/archive-published-time";
import PaginationControls from "@/components/pagination-controls";
import CustomImage, { IMAGE_SIZES } from "@/components/sanity-image";
import { perPage } from "@/lib/constants";
import { postArchiveKicker } from "@/lib/news-archive";

type PersonAuthor = {
  name: string;
  slug: string;
  roles: string[];
  biography?: string | null;
  image?: unknown;
  socialLinks?: {
    twitter?: string | null;
    facebook?: string | null;
    youtube?: string | null;
  } | null;
};

type PersonPost = {
  _id: string;
  title: string;
  slug: string;
  publishedAt?: string | null;
  image?: unknown;
  sport?: { slug?: string | null; title?: string | null } | null;
  division?: { name?: string | null } | null;
  sportSubgrouping?: { shortName?: string | null; name?: string | null } | null;
  tags?: Array<{ name?: string | null }> | null;
  storyType?: string | null;
};

export function PersonPageContent({
  author,
  posts,
  totalPosts,
  pageIndex,
  voterBallotHref,
  voterBallotLabel,
}: {
  author: PersonAuthor;
  posts: PersonPost[];
  totalPosts: number;
  pageIndex: number;
  voterBallotHref?: string | null;
  voterBallotLabel?: string | null;
}) {
  const rolesLabel = author.roles.join(" · ");
  const hasArticles = totalPosts > 0;
  const totalPages = Math.ceil(totalPosts / perPage);
  const personSocial = author.socialLinks
    ? {
        facebook: author.socialLinks.facebook,
        twitter: author.socialLinks.twitter,
        youtube: author.socialLinks.youtube,
      }
    : null;

  const hero = (
    <div className="border-b bg-gradient-to-b from-muted/60 to-background">
      <div className="mx-auto max-w-site px-4 py-6 lg:px-6">
        <SiteBreadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "People", href: "/about" },
            { label: author.name },
          ]}
        />
        <div className="mt-5 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
          <CustomImage
            image={author.image as Parameters<typeof CustomImage>[0]["image"]}
            width={144}
            height={144}
            className="size-28 rounded-full object-cover object-top sm:size-36"
            mode="cover"
          />
          <div>
            <div className="kicker text-primary">{rolesLabel}</div>
            <h1 className="mt-1 font-display text-[2.6rem] font-extrabold uppercase leading-none lg:text-headline-lg">
              {author.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {voterBallotHref && voterBallotLabel ? (
                <Button
                  size="sm"
                  className="h-7 gap-1.5 px-2.5 text-sm"
                  asChild
                >
                  <Link href={voterBallotHref} prefetch={false}>
                    <ListOrdered className="size-3.5" aria-hidden />
                    {voterBallotLabel}
                  </Link>
                </Button>
              ) : null}
              {hasArticles ? (
                <span className="text-sm text-muted-foreground">
                  {totalPosts} article{totalPosts === 1 ? "" : "s"}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Staff · {process.env.NEXT_PUBLIC_APP_NAME}
                </span>
              )}
            </div>
            {author.biography ? (
              <p className="mt-4 max-w-prose text-muted-foreground">
                {author.biography}
              </p>
            ) : null}
            {personSocial ? (
              <div className="mt-4">
                <SiteSocialButtons socialLinks={personSocial} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );

  if (!hasArticles) {
    return (
      <>
        {hero}
        <div className="mx-auto max-w-site px-4 pb-12 pt-6 lg:px-6">
          <div className="mx-auto max-w-3xl">
            <section className="border-t pt-6">
              <h2 className="font-display text-3xl font-extrabold uppercase">
                About
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                This profile is for Redshirt Sports staff who don&apos;t publish
                articles on the site. Editorial profiles with story archives use
                the same URL pattern once they have published work.
              </p>
            </section>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {hero}
      <div className="mx-auto max-w-site px-4 lg:px-6">
        <div className="pt-6">
          <div>
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="font-display text-2xl font-extrabold uppercase">
                Latest from {author.name.split(" ")[0]}
              </h2>
              {totalPages > 1 ? (
                <span className="text-sm text-muted-foreground">
                  Page {pageIndex} of {totalPages}
                </span>
              ) : null}
            </div>
            <ol className="divide-y">
              {posts.map((post) => (
                <li key={post._id}>
                  <article className="group grid grid-cols-[1fr_6rem] gap-4 py-4 sm:grid-cols-[1fr_9rem]">
                    <div>
                      <div className="kicker text-primary">
                        {postArchiveKicker({
                          _id: post._id,
                          title: post.title,
                          slug: post.slug,
                          divisionLabel: post.division?.name ?? null,
                          tagNames:
                            post.tags
                              ?.map((tag) => tag.name)
                              .filter((name): name is string =>
                                Boolean(name),
                              ) ?? null,
                        })}
                      </div>
                      <h3 className="mt-1 font-semibold leading-snug group-hover:underline">
                        <Link href={`/${post.slug}`} prefetch={false}>
                          {post.title}
                        </Link>
                      </h3>
                      {post.publishedAt ? (
                        <ArchivePublishedTime
                          dateString={post.publishedAt}
                          className="mt-1 block text-sm text-muted-foreground"
                        />
                      ) : null}
                    </div>
                    <Link
                      href={`/${post.slug}`}
                      prefetch={false}
                      className="relative aspect-[4/3] overflow-hidden rounded-md bg-muted"
                    >
                      <CustomImage
                        image={
                          post.image as Parameters<
                            typeof CustomImage
                          >[0]["image"]
                        }
                        width={144}
                        height={108}
                        className="h-full w-full object-cover"
                        mode="cover"
                        sizes={IMAGE_SIZES.articleCard}
                      />
                    </Link>
                  </article>
                </li>
              ))}
            </ol>
            {totalPages > 1 ? (
              <div className="pt-4">
                <PaginationControls totalPosts={totalPosts} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
