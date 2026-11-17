import {
  type PortalPlayerData,
  type PortalWireData,
  playerClassLabel,
  playerPath,
} from "@redshirt-sports/db/portal";
import { cn } from "@redshirt-sports/ui/lib/utils";
import {
  ArrowLeftRight,
  Check,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Info,
  Newspaper,
  PenLine,
  School,
  Undo2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import type { HomePost } from "@/components/home/home-page-content";
import { JsonLdScript } from "@/components/json-ld";
import { JourneyMore } from "@/components/portal/journey-more";
import { GradCap, SchoolMark, StatusPill } from "@/components/portal/marks";
import {
  formatSchoolCount,
  highSchoolStop,
  INTEREST_LABELS,
  type JourneyEventKind,
  type JourneyStop,
  journeyStops,
  type MoveCard,
  moveCard,
  type PlayerSport,
  playerFullName,
  playerHometown,
  playerJsonLd,
  positionLabel,
  profileInterest,
  type SideList,
  sideLists,
  sportsByActivity,
} from "@/components/portal/player-format";
import {
  formatSize,
  formatWireDate,
  portalSportLabel,
  schoolView,
  type WireSchoolView,
} from "@/components/portal/wire-format";
import { RankingsShareButton } from "@/components/rankings/rankings-share-button";
import CustomImage from "@/components/sanity-image";
import { postArchiveKicker } from "@/lib/news-archive";
import { portalWirePath } from "@/lib/portal-data";
import { sportHubPath, sportNavLabel } from "@/lib/sport-nav";

/** How many journey stops show before "Show all". */
const JOURNEY_SHOWN = 4;

const sectionTitle =
  "font-display text-2xl leading-none font-extrabold uppercase";

function SectionHead({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className={sectionTitle}>{title}</h2>
      {action}
    </div>
  );
}

function MoreLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="text-primary inline-flex shrink-0 items-center gap-1 text-sm font-semibold hover:underline"
    >
      {children}
      <ChevronRight className="size-3.5" aria-hidden />
    </Link>
  );
}

function Note({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-muted-foreground flex items-start gap-1.5 text-[11px]",
        className,
      )}
    >
      <Info className="size-3.5 shrink-0 translate-y-px" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

/** The article a fact came from. `about` says which fact, for screen readers. */
function StoryLink({ slug, about }: { slug: string; about: string }) {
  return (
    <Link
      href={`/${slug}`}
      prefetch={false}
      aria-label={`Story: ${about}`}
      className="text-primary hover:bg-accent inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold"
    >
      <Newspaper className="size-3.5" aria-hidden />
      Story
    </Link>
  );
}

function SchoolCell({
  view,
  muted = false,
}: {
  view: WireSchoolView | null;
  muted?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <SchoolMark view={view} faded={muted} />
      <div
        className={cn(
          "min-w-0 truncate text-sm font-semibold",
          muted && "text-muted-foreground",
        )}
      >
        {view?.name ?? "Undisclosed"}
      </div>
    </div>
  );
}

// ---------- Header ----------

function MoveCardView({ move }: { move: MoveCard }) {
  const { to } = move;
  const label =
    "text-muted-foreground mb-2 text-[11px] font-semibold tracking-wide uppercase";
  return (
    <div className="bg-card rounded-xl border p-3">
      {/*
        Each label comes right before its school in the markup, so a screen
        reader hears them in pairs; the grid puts both labels on one row and
        both schools on the next, so they line up whatever their heights.
      */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] grid-rows-[auto_auto] items-center gap-x-2">
        <div className={cn(label, "col-start-1 row-start-1")}>
          {move.labels[0]}
        </div>
        <div className="col-start-1 row-start-2 min-w-0">
          <SchoolCell view={move.from} muted={to.kind === "school"} />
        </div>
        <span
          className="text-muted-foreground col-start-2 row-start-2"
          aria-hidden
        >
          {to.kind === "returning" ? (
            <ChevronLeft className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </span>
        <div className={cn(label, "col-start-3 row-start-1")}>
          {move.labels[1]}
        </div>
        <div className="col-start-3 row-start-2 min-w-0">
          {to.kind === "school" ? (
            <SchoolCell view={to.view} />
          ) : to.kind === "undecided" ? (
            <div className="flex min-w-0 items-center gap-2.5">
              <SchoolMark view={null} />
              <div className="min-w-0">
                <div className="text-muted-foreground text-sm font-semibold">
                  Undecided
                </div>
                <div className="text-muted-foreground text-[11px]">
                  No commitment reported
                </div>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground flex min-h-9 min-w-0 items-center text-sm font-semibold">
              Returning to {to.name}
            </div>
          )}
        </div>
      </div>
      <div className="text-muted-foreground mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 border-t pt-2.5 text-xs">
        <StatusPill status={move.status} />
        <span className="tabular">{move.statusLine}</span>
        {move.storySlug ? (
          <span className="ml-auto">
            <StoryLink slug={move.storySlug} about={move.statusLine} />
          </span>
        ) : null}
        <span className="tabular basis-full">{move.details.join(" · ")}</span>
      </div>
    </div>
  );
}

function Band({
  data,
  sport,
  breadcrumbs,
}: {
  data: PortalPlayerData;
  sport: PlayerSport | undefined;
  breadcrumbs: { name: string; path: string }[];
}) {
  const { doc } = data;
  const latest = sport?.recruitments[0];
  const name = playerFullName(doc);
  // The school they're headed to, or at: a faint mark on the headshot.
  const headed =
    latest &&
    (latest.status === "committed" ||
      latest.status === "signed" ||
      latest.status === "enrolled")
      ? latest.destination
      : latest?.origin;
  const watermark = schoolView(data, headed)?.school?.image ?? null;
  const sportLabel = sport ? portalSportLabel(sport.sportSlug) : null;
  // "Quarterback · Graduate student": the position once, spelled out.
  const role = [
    sport
      ? (positionLabel(sport.sportSlug, sport.position) ?? sport.position)
      : null,
    latest?.classAtEntry ? playerClassLabel(latest.classAtEntry) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const hometown = playerHometown(doc);
  const size = sport ? formatSize(sport) : null;
  const tags = [
    sportLabel,
    latest ? `${latest.cycleYear} portal` : null,
  ].filter((tag): tag is string => Boolean(tag));

  return (
    <div className="from-muted/60 to-background border-b bg-gradient-to-b">
      <div className="max-w-site mx-auto px-4 pt-5 pb-6 lg:px-6">
        <nav
          className="text-muted-foreground flex flex-wrap items-center gap-1 text-xs"
          aria-label="Breadcrumb"
        >
          {breadcrumbs.slice(1, -1).map((crumb) => (
            <span key={crumb.path} className="flex items-center gap-1">
              <Link
                href={crumb.path}
                className="hover:text-foreground"
                prefetch={false}
              >
                {crumb.name}
              </Link>
              <ChevronRight className="size-3 shrink-0" aria-hidden />
            </span>
          ))}
          <span className="text-foreground" aria-current="page">
            {name}
          </span>
        </nav>

        {/*
          One row on desktop: the player, the move, then share. On phones the
          move card drops under the player and share sits top right.
        */}
        <div className="relative mt-4 flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
          <div className="flex min-w-0 flex-1 items-start gap-4 pr-12 lg:gap-6 lg:pr-0">
            <div className="bg-muted relative aspect-[4/5] w-[5.5rem] shrink-0 overflow-hidden rounded-xl border sm:w-28 lg:w-36">
              <Image
                src="/images/player-avatar.svg"
                alt=""
                fill
                sizes="144px"
                className="object-cover object-bottom"
                priority
              />
              {watermark ? (
                <CustomImage
                  image={
                    watermark as Parameters<typeof CustomImage>[0]["image"]
                  }
                  width={96}
                  height={96}
                  mode="contain"
                  alt=""
                  aria-hidden
                  className="pointer-events-none absolute right-1.5 bottom-1.5 size-9 opacity-40 sm:size-11 lg:size-14"
                />
              ) : null}
            </div>
            <div className="min-w-0 pt-0.5">
              {sportLabel ? (
                <div className="kicker text-primary">
                  Transfer Portal · {sportLabel}
                </div>
              ) : null}
              <h1 className="font-display sm:text-headline lg:text-headline-lg mt-1 flex flex-wrap items-center gap-x-3 text-[2.1rem] leading-[0.95] font-extrabold uppercase">
                {name}
                {latest?.isGradTransfer ? (
                  <GradCap iconClassName="size-7" />
                ) : null}
              </h1>
              {/* The same lines as the player's row on the tracker. */}
              {role ? (
                <p className="mt-2 text-sm font-semibold">{role}</p>
              ) : null}
              {hometown ? (
                <p className="text-muted-foreground mt-0.5 text-sm">
                  <span className="sr-only">From </span>
                  {hometown}
                </p>
              ) : null}
              {size ? (
                <p className="tabular mt-0.5 text-sm">
                  <span className="sr-only">Height and weight: </span>
                  {size}
                </p>
              ) : null}
              {tags.length ? (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-muted text-muted-foreground inline-flex h-5 items-center rounded-md px-1.5 text-[10px] font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          {latest ? (
            <div className="lg:w-[400px] lg:shrink-0">
              <MoveCardView move={moveCard(data, latest)} />
            </div>
          ) : null}
          <div className="absolute top-0 right-0 lg:static">
            <RankingsShareButton title={name} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Main modules ----------

const EVENT_ICONS: Record<
  JourneyEventKind,
  { icon: typeof Check; className: string }
> = {
  portal: { icon: ArrowLeftRight, className: "text-up" },
  commit: { icon: Check, className: "text-primary" },
  decommit: { icon: X, className: "text-muted-foreground" },
  sign: { icon: PenLine, className: "text-primary" },
  enroll: { icon: School, className: "text-primary" },
  withdraw: { icon: Undo2, className: "text-muted-foreground" },
};

function StopNode({ stop }: { stop: JourneyStop }) {
  if (stop.kind === "high-school") {
    return (
      <span className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-full border">
        <GraduationCap className="size-4" aria-hidden />
      </span>
    );
  }
  return (
    <SchoolMark
      view={stop.view}
      ring={stop.kind === "next" && stop.view !== null}
    />
  );
}

function StopItem({ stop, last }: { stop: JourneyStop; last: boolean }) {
  return (
    <li className="relative grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 pb-4 last:pb-0">
      {last ? null : (
        <span
          className="bg-border absolute top-10 bottom-0 left-[17px] w-px"
          aria-hidden
        />
      )}
      <StopNode stop={stop} />
      <div className="min-w-0 pt-0.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={cn(
                "font-display text-lg leading-tight font-bold",
                stop.kind === "next" && !stop.view && "text-muted-foreground",
              )}
            >
              {stop.name}
            </span>
            {stop.status ? (
              <StatusPill
                status={stop.status}
                className="h-5 px-2 text-[10px]"
              />
            ) : null}
          </div>
          {stop.years ? (
            <span className="text-muted-foreground tabular shrink-0 text-xs font-semibold">
              {stop.years}
            </span>
          ) : null}
        </div>
        {stop.line ? (
          <div className="text-muted-foreground text-xs">{stop.line}</div>
        ) : null}
        {stop.events.length ? (
          <ul className="mt-1.5 grid gap-1">
            {stop.events.map((event) => {
              const { icon: Icon, className } = EVENT_ICONS[event.kind];
              return (
                <li
                  key={event.id}
                  className={cn(
                    "flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs",
                    event.superseded && "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 font-medium",
                      event.superseded && "line-through",
                    )}
                  >
                    <Icon
                      className={cn("size-3.5", !event.superseded && className)}
                      aria-hidden
                    />
                    {event.label}
                  </span>
                  <span className="text-muted-foreground tabular">
                    {event.date}
                  </span>
                  {event.storySlug ? (
                    <StoryLink slug={event.storySlug} about={event.label} />
                  ) : null}
                  {/* Strikethrough isn't announced; the word is. */}
                  {event.superseded ? (
                    <span className="text-muted-foreground text-[10px] font-semibold uppercase">
                      Dropped
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </li>
  );
}

function Journey({
  data,
  sport,
}: {
  data: PortalPlayerData;
  sport: PlayerSport;
}) {
  const highSchool = highSchoolStop(data.doc);
  const stops = [
    ...journeyStops(data, sport),
    ...(highSchool ? [highSchool] : []),
  ];
  if (stops.length === 0) return null;
  // Fold only when it hides at least two: "+1" saves nothing.
  const fold = stops.length > JOURNEY_SHOWN + 1;
  const shown = fold ? stops.slice(0, JOURNEY_SHOWN) : stops;
  const hidden = fold ? stops.slice(JOURNEY_SHOWN) : [];
  return (
    <section>
      <SectionHead
        title="Journey"
        action={
          <span className="text-muted-foreground text-xs">
            {stops.length} stop{stops.length === 1 ? "" : "s"} · newest first
          </span>
        }
      />
      <div className="bg-card rounded-xl border p-4 lg:p-5">
        <ol className="grid">
          {shown.map((stop, index) => (
            <StopItem
              key={stop.key}
              stop={stop}
              last={index === stops.length - 1}
            />
          ))}
          {hidden.length ? (
            <JourneyMore
              total={stops.length}
              earlier={hidden.map((stop) => stop.name)}
            >
              {hidden.map((stop, index) => (
                <StopItem
                  key={stop.key}
                  stop={stop}
                  last={index === hidden.length - 1}
                />
              ))}
            </JourneyMore>
          ) : null}
        </ol>
      </div>
    </section>
  );
}

const INTEREST_PILLS: Record<string, string> = {
  visited: "border-new/40 text-new",
  visit_scheduled: "bg-secondary text-secondary-foreground border-transparent",
};

/** Offers, contact, and visits: one row per school. */
function Interest({
  data,
  sport,
}: {
  data: PortalPlayerData;
  sport: PlayerSport;
}) {
  const rows = profileInterest(data, sport);
  if (rows.length === 0) return null;
  const count = (status: string) =>
    rows.filter((row) => row.status === status).length;
  const chips = [
    `${formatSchoolCount(rows.length)} reported`,
    count("visited") ? `${count("visited")} visited` : null,
    count("visit_scheduled")
      ? `${count("visit_scheduled")} visit${count("visit_scheduled") === 1 ? "" : "s"} scheduled`
      : null,
  ].filter((chip): chip is string => chip !== null);
  return (
    <section>
      <SectionHead title="Offers & reported interest" />
      <ul className="mb-2 flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <li
            key={chip}
            className="bg-secondary text-secondary-foreground inline-flex h-6 items-center rounded-md px-2 text-xs font-medium"
          >
            {chip}
          </li>
        ))}
      </ul>
      <div className="bg-card overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <caption className="sr-only">
            Schools reported to have offered, contacted, or hosted the player
          </caption>
          <thead>
            <tr className="text-muted-foreground border-b text-left text-[11px] tracking-wide uppercase">
              <th className="h-9 p-2 pl-4 font-semibold">School</th>
              <th className="h-9 p-2 font-semibold">Status</th>
              <th className="h-9 p-2 font-semibold">Date</th>
              <th className="hidden h-9 p-2 font-semibold md:table-cell">
                Detail
              </th>
              <th className="h-9 p-2 pr-4">
                <span className="sr-only">Story</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.key}
                className="hover:bg-muted/50 border-b last:border-0"
              >
                <td className="p-2 pl-4">
                  <div className="flex min-w-0 items-center gap-2">
                    <SchoolMark view={row.view} className="size-7" />
                    <span className="truncate font-medium">
                      {row.view?.name ?? "Undisclosed"}
                    </span>
                  </div>
                </td>
                <td className="p-2">
                  {row.status === "committed" ? (
                    <StatusPill status="committed" />
                  ) : (
                    <span
                      className={cn(
                        "inline-flex h-6 items-center rounded-full border px-2.5 text-xs font-medium whitespace-nowrap",
                        INTEREST_PILLS[row.status],
                      )}
                    >
                      {INTEREST_LABELS[row.status]}
                    </span>
                  )}
                </td>
                <td className="text-muted-foreground tabular p-2 whitespace-nowrap">
                  {row.date}
                  {row.cycleYear !== sport.recruitments[0]?.cycleYear ? (
                    <span className="ml-1 text-[11px]">({row.cycleYear})</span>
                  ) : null}
                </td>
                <td className="text-muted-foreground hidden p-2 md:table-cell">
                  {row.detail}
                </td>
                <td className="p-2 pr-4 text-right">
                  {row.storySlug ? (
                    <StoryLink
                      slug={row.storySlug}
                      about={`${row.view?.name ?? "Undisclosed"}, ${INTEREST_LABELS[row.status]}`}
                    />
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Note className="mt-2">
        Only schools named in Redshirt reporting. Not predictions: Redshirt
        doesn&apos;t forecast commitments.
      </Note>
    </section>
  );
}

/** Articles an editor tagged with the player, newest first. */
function Stories({ stories }: { stories: HomePost[] }) {
  if (stories.length === 0) return null;
  return (
    <section>
      <SectionHead title="Stories" />
      <ul className="divide-y border-t">
        {stories.map((post) => {
          const author = post.authors?.[0]?.name;
          return (
            <li key={post._id}>
              <article className="group relative grid grid-cols-[1fr_7rem] gap-4 py-4 sm:grid-cols-[1fr_10rem]">
                <div className="min-w-0">
                  <div className="kicker text-primary">
                    {postArchiveKicker(post)}
                  </div>
                  <h3 className="font-display mt-1 text-xl leading-tight font-bold group-hover:underline">
                    <Link
                      href={`/${post.slug}`}
                      prefetch={false}
                      className="after:absolute after:inset-0"
                    >
                      {post.title}
                    </Link>
                  </h3>
                  {post.excerpt ? (
                    <p className="text-muted-foreground mt-1 line-clamp-2 hidden text-sm sm:block">
                      {post.excerpt}
                    </p>
                  ) : null}
                  <p className="text-muted-foreground mt-2 text-xs">
                    {author}
                    {author && post.publishedAt ? " · " : null}
                    {post.publishedAt ? (
                      <time dateTime={post.publishedAt}>
                        {formatWireDate(post.publishedAt)}
                      </time>
                    ) : null}
                  </p>
                </div>
                <div className="aspect-[4/3] overflow-hidden rounded-md">
                  <CustomImage
                    image={
                      post.image as Parameters<typeof CustomImage>[0]["image"]
                    }
                    width={160}
                    height={120}
                    className="h-full w-full object-cover"
                    mode="cover"
                    sizes="160px"
                  />
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ---------- Sidebar ----------

/** Both lists empty: one card with both tracker links, not two "No other…" cards. */
function QuietSideCard({ lists }: { lists: SideList[] }) {
  return (
    <section className="bg-card rounded-xl border px-5 pt-5 pb-4">
      <h2 className="font-display text-xl leading-tight font-extrabold uppercase">
        Around the portal
      </h2>
      <p className="text-muted-foreground mt-0.5 text-sm">
        {lists[0]?.description}
      </p>
      <ul className="text-muted-foreground mt-3 grid gap-1 text-sm">
        {lists.map((list) => (
          <li key={list.title}>{list.empty}</li>
        ))}
      </ul>
      <ul className="mt-3 grid gap-1.5 border-t pt-3">
        {lists.map((list) => (
          <li key={list.link.href}>
            <MoreLink href={list.link.href}>{list.link.label}</MoreLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SideListCard({ list }: { list: SideList }) {
  return (
    <section className="bg-card rounded-xl border px-5 pt-5 pb-4">
      <h2 className="font-display text-xl leading-tight font-extrabold uppercase">
        {list.title}
      </h2>
      <p className="text-muted-foreground mt-0.5 text-sm">{list.description}</p>
      {list.players.length === 0 ? (
        <p className="text-muted-foreground border-b py-3 text-sm">
          {list.empty}
        </p>
      ) : null}
      <ul className="mt-2">
        {list.players.map((player) => (
          <li key={player.id} className="border-b last:border-0">
            <Link
              href={player.path}
              prefetch={false}
              className="hover:bg-accent/30 flex items-center gap-3 py-2.5"
            >
              <span
                className="bg-secondary text-secondary-foreground flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                aria-hidden
              >
                {player.initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="font-display block truncate text-base leading-tight font-bold">
                  {player.name}
                </span>
                <span className="text-muted-foreground block truncate text-xs">
                  {player.line}
                </span>
              </span>
              <StatusPill
                status={player.status}
                className="h-5 px-1.5 text-[10px]"
              />
            </Link>
          </li>
        ))}
      </ul>
      <div className="pt-2">
        <MoreLink href={list.link.href}>{list.link.label}</MoreLink>
      </div>
    </section>
  );
}

// ---------- Page ----------

/**
 * A player's profile: the header band, portal status, journey, and offers,
 * with a sidebar of related moves. `wire` is the cycle of the player's latest
 * move and its tracker's current cycle, for the sidebar; null hides it.
 */
export function PlayerProfile({
  data,
  sidebar,
  stories = [],
  adSlot = null,
}: {
  data: PortalPlayerData;
  sidebar: { wire: PortalWireData; currentCycle: number } | null;
  /** Articles tagged with this player, newest first. */
  stories?: HomePost[];
  /** Sidebar sponsorship placement. Loads its own data. */
  adSlot?: ReactNode;
}) {
  const { doc } = data;
  const [primary] = sportsByActivity(doc);
  const latest = primary?.recruitments[0];
  const name = playerFullName(doc);
  const path = playerPath(doc);
  const breadcrumbs = [
    { name: "Home", path: "/" },
    ...(primary
      ? [
          {
            name: sportNavLabel(primary.sportSlug, primary.sportSlug),
            path: sportHubPath(primary.sportSlug),
          },
          { name: "Transfer Portal", path: portalWirePath(primary.sportSlug) },
        ]
      : []),
    { name, path },
  ];
  const lists =
    sidebar && primary && latest
      ? sideLists(sidebar.wire, doc, primary, latest, sidebar.currentCycle)
      : [];
  const quiet = lists.length > 1 && lists.every((list) => !list.players.length);

  return (
    <div className="pb-12">
      <JsonLdScript
        id={`player-${doc.id}`}
        data={playerJsonLd(data, path, breadcrumbs)}
      />
      <Band data={data} sport={primary} breadcrumbs={breadcrumbs} />
      <div className="max-w-site mx-auto px-4 lg:px-6">
        <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="grid min-w-0 grid-cols-1 content-start gap-8">
            {!primary ? (
              <p className="text-muted-foreground text-sm">
                No portal moves on record yet.
              </p>
            ) : (
              <>
                <Journey data={data} sport={primary} />
                <Interest data={data} sport={primary} />
                <Stories stories={stories} />
              </>
            )}
            <Note>
              Editor-maintained from Redshirt reporting. Redshirt does not
              publish star ratings or recruiting rankings.
            </Note>
          </div>
          {/* Down by the height of a section heading, so the first card lines up with the first card on the left. */}
          <aside className="grid min-w-0 grid-cols-1 content-start gap-6 lg:mt-9">
            {quiet ? (
              <QuietSideCard lists={lists} />
            ) : (
              lists
                .slice(0, 1)
                .map((list) => <SideListCard key={list.title} list={list} />)
            )}
            {/* Between the two lists, as the mockup has it. Nothing when unsold. */}
            {adSlot}
            {quiet
              ? null
              : lists
                  .slice(1)
                  .map((list) => <SideListCard key={list.title} list={list} />)}
          </aside>
        </div>
      </div>
    </div>
  );
}

export function PlayerProfileSkeleton() {
  return (
    <div className="pb-12" aria-busy>
      <div className="from-muted/60 to-background border-b bg-gradient-to-b">
        <div className="max-w-site mx-auto flex flex-col gap-4 px-4 py-5 lg:px-6">
          <div className="bg-muted h-3 w-48 animate-pulse rounded" />
          <div className="flex gap-6">
            <div className="bg-muted aspect-[4/5] w-28 animate-pulse rounded-xl lg:w-36" />
            <div className="bg-muted h-16 w-72 max-w-full animate-pulse rounded" />
          </div>
          <div className="bg-muted h-28 w-full animate-pulse rounded-xl" />
        </div>
      </div>
      <div className="max-w-site mx-auto grid gap-8 px-4 pt-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-6">
        <div className="bg-muted h-96 animate-pulse rounded-xl" />
        <div className="bg-muted h-64 animate-pulse rounded-xl" />
      </div>
    </div>
  );
}
