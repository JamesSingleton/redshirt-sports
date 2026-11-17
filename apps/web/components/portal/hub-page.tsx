import { playerPath } from "@redshirt-sports/db/portal";
import type { DynamicFetchOptions } from "@redshirt-sports/sanity/live";
import { queryPortalNews } from "@redshirt-sports/sanity/queries";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import type { HomePost } from "@/components/home/home-page-content";
import { JsonLdScript } from "@/components/json-ld";
import { NewsArchiveRiver } from "@/components/news/news-archive-river";
import PaginationControls from "@/components/pagination-controls";
import { SchoolMark, StatusPill } from "@/components/portal/marks";
import {
  formatWireDate,
  playerName,
  portalSportLabel,
  schoolView,
} from "@/components/portal/wire-format";
import { perPage } from "@/lib/constants";
import { buildIndexedPageJsonLd } from "@/lib/page-json-ld";
import { portalWirePath } from "@/lib/portal-data";
import {
  getPortalHubData,
  type HubMove,
  type HubSport,
} from "@/lib/portal-hub";
import { sanityFetchPage } from "@/lib/sanity-fetch";

export const PORTAL_HUB_PATH = "/transfer-portal";
export const PORTAL_HUB_TITLE =
  "College Transfer Portal: News and Latest Moves";
export const PORTAL_HUB_DESCRIPTION =
  "Transfer portal news and the latest entries, commitments, and withdrawals across college football and men's and women's basketball.";

const sectionTitle =
  "font-display text-2xl leading-none font-extrabold uppercase";

/** One sport's tracker: this cycle's counts and the way in. */
function TrackerCard({ sport }: { sport: HubSport }) {
  const label = portalSportLabel(sport.sport);
  const stats: [string, number][] = [
    ["Entered", sport.counts.entered],
    ["Committed", sport.counts.committed],
    ["Withdrawn", sport.counts.withdrawn],
  ];
  return (
    <li>
      <Link
        href={portalWirePath(sport.sport)}
        prefetch={false}
        className="bg-card hover:bg-accent/30 group flex h-full flex-col rounded-xl border p-4"
      >
        <span className="kicker text-primary">{sport.cycleYear} portal</span>
        <span className="font-display mt-1 text-xl leading-tight font-extrabold uppercase group-hover:underline">
          {label}
        </span>
        <dl className="mt-3 grid grid-cols-3 gap-2">
          {stats.map(([name, value]) => (
            <div key={name}>
              <dt className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                {name}
              </dt>
              <dd className="tabular font-display text-2xl leading-none font-bold">
                {value.toLocaleString()}
              </dd>
            </div>
          ))}
        </dl>
        <span className="text-primary mt-3 inline-flex items-center gap-1 text-sm font-semibold">
          {label} tracker
          <ChevronRight className="size-3.5" aria-hidden />
        </span>
      </Link>
    </li>
  );
}

function MoveRow({ move }: { move: HubMove }) {
  const { row, wire } = move;
  const from = schoolView(wire, row.origin);
  const to = schoolView(wire, row.destination);
  const withdrew = row.status === "withdrawn";
  return (
    <li className="flex items-center gap-3 border-b py-2.5 last:border-0">
      <span className="flex shrink-0 items-center gap-1">
        <SchoolMark view={from} faded={!withdrew} className="size-7" />
        <ChevronRight
          className="text-muted-foreground size-3 shrink-0"
          aria-hidden
        />
        <SchoolMark view={withdrew ? from : to} className="size-7" />
      </span>
      <span className="min-w-0 flex-1">
        <Link
          href={playerPath({ id: row.playerId, slug: row.slug })}
          prefetch={false}
          className="font-display block truncate text-base leading-tight font-bold hover:underline"
        >
          {playerName(row)}
        </Link>
        <span className="text-muted-foreground block truncate text-xs">
          {[row.position, portalSportLabel(move.sport)]
            .filter(Boolean)
            .join(" · ")}
          {" · "}
          <time dateTime={row.occurredAt}>
            {formatWireDate(row.occurredAt, true)}
          </time>
        </span>
        <span className="sr-only">
          {withdrew
            ? `, returning to ${from?.name ?? "previous school"}`
            : `, ${from?.name ?? "undisclosed"} to ${to?.name ?? "undecided"}`}
        </span>
      </span>
      <StatusPill status={row.status} className="h-5 px-1.5 text-[10px]" />
    </li>
  );
}

/**
 * The transfer portal front page: each sport's tracker, the latest moves
 * across them, and stories on the Transfer Portal beat (`?page=n`).
 */
export async function PortalHub({
  pageIndex,
  perspective,
  stega,
}: { pageIndex: number } & DynamicFetchOptions) {
  const from = (pageIndex - 1) * perPage;
  const [hub, newsResponse] = await Promise.all([
    getPortalHubData(),
    sanityFetchPage({
      query: queryPortalNews,
      params: { from, to: from + perPage },
      perspective,
      stega,
    }),
  ]);
  const news = newsResponse.data as {
    posts?: HomePost[];
    totalPosts?: number;
  } | null;
  const posts = news?.posts ?? [];
  const totalPosts = news?.totalPosts ?? posts.length;
  const totalPages = Math.ceil(totalPosts / perPage);
  // Past the last page of stories isn't a page.
  if (pageIndex > 1 && posts.length === 0) notFound();

  return (
    <div className="pb-12">
      <JsonLdScript
        id="portal-hub"
        data={buildIndexedPageJsonLd({
          pageType: "CollectionPage",
          name: PORTAL_HUB_TITLE,
          description: PORTAL_HUB_DESCRIPTION,
          path:
            pageIndex > 1
              ? `${PORTAL_HUB_PATH}?page=${pageIndex}`
              : PORTAL_HUB_PATH,
          breadcrumbs: [
            { name: "Home", path: "/" },
            { name: "Transfer Portal", path: PORTAL_HUB_PATH },
          ],
          items: posts.map((post) => ({
            name: post.title,
            path: `/${post.slug}`,
          })),
        })}
      />
      <div className="from-muted/60 to-background border-b bg-gradient-to-b">
        <div className="max-w-site mx-auto px-4 pt-6 pb-6 lg:px-6">
          <div className="kicker text-primary">College sports</div>
          <h1 className="font-display sm:text-headline lg:text-headline-lg mt-1 text-[2.1rem] leading-[0.95] font-extrabold uppercase">
            Transfer Portal
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
            Who&apos;s in, who&apos;s committed, and who&apos;s staying put,
            with Redshirt reporting on the moves that matter.
          </p>
          {hub.sports.length ? (
            <ul
              className="mt-5 grid gap-3 md:grid-cols-3"
              aria-label="Trackers by sport"
            >
              {hub.sports.map((sport) => (
                <TrackerCard key={sport.sport} sport={sport} />
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="max-w-site mx-auto px-4 lg:px-6">
        <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section aria-labelledby="portal-stories" className="min-w-0">
            <h2 id="portal-stories" className={sectionTitle}>
              Portal stories
            </h2>
            {posts.length ? (
              <div className="mt-4">
                <NewsArchiveRiver
                  posts={posts}
                  pageIndex={pageIndex}
                  totalPosts={totalPosts}
                  totalPages={totalPages}
                  showSportLabels
                />
                {totalPages > 1 ? (
                  <nav aria-label="Pagination" className="pt-6">
                    <PaginationControls totalPosts={totalPosts} />
                  </nav>
                ) : null}
              </div>
            ) : (
              <p className="text-muted-foreground mt-3 text-sm">
                No portal stories yet.
              </p>
            )}
          </section>

          <aside className="min-w-0 lg:mt-9">
            <section
              aria-labelledby="latest-moves"
              className="bg-card rounded-xl border px-5 pt-5 pb-3"
            >
              <h2
                id="latest-moves"
                className="font-display text-xl leading-tight font-extrabold uppercase"
              >
                Latest moves
              </h2>
              {hub.moves.length ? (
                <ul className="mt-2">
                  {hub.moves.map((move) => (
                    <MoveRow
                      key={`${move.sport}-${move.row.recruitmentId}`}
                      move={move}
                    />
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground mt-2 pb-2 text-sm">
                  No moves reported yet this cycle.
                </p>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

export function PortalHubSkeleton() {
  return (
    <div className="pb-12" aria-busy>
      <div className="from-muted/60 to-background border-b bg-gradient-to-b">
        <div className="max-w-site mx-auto flex flex-col gap-4 px-4 py-6 lg:px-6">
          <div className="bg-muted h-10 w-72 max-w-full animate-pulse rounded" />
          <div className="bg-muted h-28 w-full animate-pulse rounded-xl" />
        </div>
      </div>
      <div className="max-w-site mx-auto grid gap-8 px-4 pt-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-6">
        <div className="bg-muted h-96 animate-pulse rounded-xl" />
        <div className="bg-muted h-80 animate-pulse rounded-xl" />
      </div>
    </div>
  );
}
