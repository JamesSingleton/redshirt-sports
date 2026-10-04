import {
  type DynamicFetchOptions,
  PUBLISHED_FETCH_OPTIONS,
} from "@redshirt-sports/sanity/live";
import { authorsListNotArchived } from "@redshirt-sports/sanity/queries";
import { buttonVariants } from "@redshirt-sports/ui/components/button";
import type { Metadata, Route } from "next";
import Link from "next/link";
import type { AboutPage as AboutPageSchema, WithContext } from "schema-dts";

import { JsonLdScript, websiteId } from "@/components/json-ld";
import { SectionHeader } from "@/components/news/section-header";
import PageHeader from "@/components/page-header";
import CustomImage from "@/components/sanity-image";
import { SidebarCard } from "@/components/sidebar-card";
import { draftAwarePage } from "@/lib/draft-cache";
import { getBaseUrl } from "@/lib/get-base-url";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { sanityFetchPage } from "@/lib/sanity-fetch";

export async function generateMetadata(): Promise<Metadata> {
  const { perspective } = PUBLISHED_FETCH_OPTIONS;
  return getPageMetadata(
    {
      title: "About Us",
      description: `Meet the team at ${process.env.NEXT_PUBLIC_APP_NAME}! We're dedicated to bringing you comprehensive coverage of college sports at every level, sharing our mission and expertise.`,
      slug: "/about",
    },
    perspective,
  );
}

const aboutPageJsonLd: WithContext<AboutPageSchema> = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "@id": `${getBaseUrl()}/about`,
  url: `${getBaseUrl()}/about`,
  description: `Meet the team at ${process.env.NEXT_PUBLIC_APP_NAME}! We're dedicated to bringing you comprehensive coverage of college sports at every level, sharing our mission and expertise.`,
  isPartOf: {
    "@type": "WebSite",
    "@id": websiteId,
  },
  inLanguage: "en-US",
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${getBaseUrl()}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "About",
        item: `${getBaseUrl()}/about`,
      },
    ],
  },
};

export default async function AboutPage() {
  return draftAwarePage(null, renderAboutPage);
}

async function renderAboutPage({ perspective, stega }: DynamicFetchOptions) {
  "use cache";
  const { data: authors } = await sanityFetchPage({
    query: authorsListNotArchived,
    perspective,
    stega,
  });

  return (
    <>
      <JsonLdScript data={aboutPageJsonLd} id="about-page-json-ld" />
      <PageHeader
        title="About Redshirt Sports"
        subtitle="College football and basketball coverage for every level of the game, from the FBS to D3."
      />
      <div className="container grid grid-cols-1 gap-8 pb-12 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-12 lg:col-span-8">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p>
              Redshirt Sports started with the FCS, and our passion for college
              football has grown well beyond it. Today we cover the FBS, FCS,
              D2, and D3 with the same commitment to in-depth analysis, breaking
              news, and the stories that make each program unique.
            </p>
            <p>
              We believe every level of college football deserves recognition.
              Whether you follow the thrilling FBS action, the fierce
              competition of D2, or the dedication on display in D3, you will
              find a home with us.
            </p>
            <p>
              Beyond the games, our team tracks the transfer portal and the
              recruiting trail, analyzing transfers, evaluating the impact of
              new recruits, and publishing our weekly Top 25 polls.
            </p>
          </div>

          {authors && authors.length > 0 ? (
            <section
              aria-labelledby="about-team"
              className="flex flex-col gap-6"
            >
              <SectionHeader id="about-team" title="Our team" />
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {authors.map((author) => (
                  <li
                    key={author._id}
                    className="bg-card hover:bg-accent relative flex items-center gap-4 rounded-md border p-4 transition-colors"
                  >
                    <CustomImage
                      image={author.image}
                      className="size-16 shrink-0 rounded-full object-cover object-top"
                      width={64}
                      height={64}
                      mode="cover"
                    />
                    <div className="min-w-0">
                      <h3 className="font-bold">
                        <Link
                          href={`/authors/${author.slug}` as Route}
                          prefetch={false}
                        >
                          <span
                            aria-hidden="true"
                            className="absolute inset-0"
                          />
                          {author.name}
                        </Link>
                      </h3>
                      {author.roles?.length ? (
                        <p className="text-muted-foreground text-sm">
                          {author.roles.join(", ")}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-20 lg:col-span-4 lg:self-start">
          <SidebarCard.Root labelledBy="write-for-us">
            <SidebarCard.Header id="write-for-us" title="Write for us" />
            <div className="flex flex-col gap-4 px-4 pb-4 text-sm">
              <p className="text-muted-foreground text-pretty">
                Have a unique perspective, insider knowledge, or a knack for
                storytelling? We welcome articles, opinion pieces, game recaps,
                and player profiles from people who love college sports.
              </p>
              <p className="text-muted-foreground text-pretty">
                Send us your name and a short note about what you would like to
                cover, and our editors will be in touch.
              </p>
              <Link
                href="/contact"
                className={buttonVariants({ className: "self-start" })}
              >
                Contact our editors
              </Link>
            </div>
          </SidebarCard.Root>
        </aside>
      </div>
    </>
  );
}
