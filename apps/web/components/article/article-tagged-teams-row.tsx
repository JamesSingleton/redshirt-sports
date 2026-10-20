"use client";

import Link from "next/link";
import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import CustomImage from "@/components/sanity-image";
import type { ArticleTeamInStory } from "@/lib/article-page";

function useScrollFades(scrollerRef: RefObject<HTMLElement | null>) {
  const [fadeStart, setFadeStart] = useState(false);
  const [fadeEnd, setFadeEnd] = useState(false);

  const update = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    setFadeStart(scrollLeft > 4);
    setFadeEnd(maxScroll > 4 && scrollLeft < maxScroll - 4);
  }, [scrollerRef]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [update, scrollerRef]);

  return { fadeStart, fadeEnd };
}

export function ArticleTaggedTeamsRow({
  teams,
}: {
  teams: ArticleTeamInStory[];
}) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const { fadeStart, fadeEnd } = useScrollFades(scrollerRef);

  if (teams.length === 0) {
    return null;
  }

  return (
    <section
      className="mx-auto mt-6 max-w-prose"
      aria-labelledby="article-tagged-teams"
    >
      <h2 id="article-tagged-teams" className="kicker text-muted-foreground">
        Schools in this article
      </h2>
      <div className="relative mt-2">
        {fadeStart ? (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-background to-transparent"
            aria-hidden
          />
        ) : null}
        {fadeEnd ? (
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-background to-transparent"
            aria-hidden
          />
        ) : null}
        <ul
          ref={scrollerRef}
          className="flex gap-2 overflow-x-auto overscroll-x-contain py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Schools tagged on this article"
        >
          {teams.map((team) => (
            <li key={team._id} className="shrink-0">
              <Link
                href={`/college/teams/${team.slug}`}
                prefetch={false}
                className="flex h-14 w-[10.5rem] items-center gap-2 rounded-lg border bg-card px-2.5 text-sm font-semibold shadow-xs transition-colors hover:border-primary/50 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:w-[11.5rem]"
              >
                {team.image ? (
                  <CustomImage
                    image={team.image}
                    width={32}
                    height={32}
                    className="size-8 shrink-0 object-contain"
                    mode="contain"
                  />
                ) : null}
                <span className="line-clamp-2 min-w-0 flex-1 leading-snug">
                  {team.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
