import type { SanityImageData } from "@redshirt-sports/sanity/image";
import { cn } from "@redshirt-sports/ui/lib/utils";
import { CameraIcon } from "lucide-react";
import Link from "next/link";
import {
  PortableText,
  type PortableTextBlock,
  type PortableTextMarkComponentProps,
  type PortableTextReactComponents,
  type PortableTextTypeComponentProps,
} from "next-sanity";

import { BracketEmbed } from "@/components/bracket/bracket-embed";
import CustomImage, { IMAGE_SIZES } from "@/components/sanity-image";
import { ReactTweet as Tweet } from "@/components/tweet";
import { PortableTable } from "./portable-table";
import { YouTubeEmbedComponent } from "./youtube-embed";

type TwitterEmbedValue = {
  _type: "twitter";
  id: string;
};

type BracketEmbedValue = {
  _type: "bracketEmbed";
  editionId: string;
  caption?: string;
};

type YoutubeEmbedValue = {
  _type: "youtubeEmbed";
  url: string;
  autoplay?: boolean;
  description?: string;
  height?: number | string;
  requireConsent?: boolean;
  thumbnail?: string;
  title?: string;
  width?: number | string;
};

type PullQuoteValue = {
  _type: "pullQuote";
  quote?: string;
  attribution?: string;
  role?: string;
};

type CalloutValue = {
  _type: "callout";
  kind?: "context" | "numbers" | "update";
  title?: string;
  text?: string;
};

type RelatedArticleValue = {
  _type: "relatedArticle";
  label?: string;
  post?: { title?: string | null; slug?: string | null } | null;
};

type SocialEmbedValue = {
  _type: "socialEmbed";
  url?: string;
  caption?: string;
};

const CALLOUT_LABEL: Record<NonNullable<CalloutValue["kind"]>, string> = {
  context: "Context",
  numbers: "By the numbers",
  update: "Update",
};

function socialHost(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Card for a story placed inside another story's body. */
function RelatedArticleCard({
  label,
  post,
}: {
  label?: string | null;
  post?: {
    title?: string | null;
    slug?: string | null;
    excerpt?: string | null;
  } | null;
}) {
  if (!post?.slug || !post.title) return null;
  return (
    <aside className="not-prose my-6 rounded-xl border bg-muted/40 p-4">
      <p className="kicker text-primary">{label || "Related"}</p>
      <Link
        href={`/${post.slug}`}
        prefetch={false}
        className="mt-1 block font-display text-xl font-bold uppercase leading-tight hover:text-primary"
      >
        {post.title}
      </Link>
    </aside>
  );
}

type SiteLinkMarkValue = {
  _type: string;
  href?: string;
  openInNewTab?: boolean;
  /** Old-format links stored the new-tab choice as `blank`. */
  blank?: boolean;
};

function SiteLinkMark({
  children,
  value,
}: PortableTextMarkComponentProps<SiteLinkMarkValue>) {
  const href = value?.href;
  const openInNewTab = value?.openInNewTab ?? value?.blank;
  if (!href) return <>{children}</>;
  if (openInNewTab) {
    return (
      <a
        href={href}
        rel="noreferrer noopener"
        target="_blank"
        className="hover:text-muted-foreground underline"
      >
        {children}
      </a>
    );
  }
  return (
    <Link
      href={href}
      prefetch={false}
      className="hover:text-muted-foreground underline"
    >
      {children}
    </Link>
  );
}

export const richTextComponents: Partial<PortableTextReactComponents> = {
  marks: {
    customLink: SiteLinkMark,
    customUrl: SiteLinkMark,
    internalLink: ({ children, value }: PortableTextMarkComponentProps) => {
      return (
        <Link
          href={value?.href}
          prefetch={false}
          className="hover:text-muted-foreground underline"
        >
          {children}
        </Link>
      );
    },
    // The current link annotation; `href` and `openInNewTab` are resolved in
    // the query. Old-format links share the type name and resolve the same.
    link: SiteLinkMark,
  },
  types: {
    twitter: ({ value }: PortableTextTypeComponentProps<TwitterEmbedValue>) => {
      return (
        <div className="not-prose flex items-center justify-center">
          <Tweet id={value.id} />
        </div>
      );
    },
    image: ({
      value,
    }: PortableTextTypeComponentProps<
      SanityImageData & { _type: "image" }
    >) => {
      return (
        <figure className="my-2 flex flex-col items-center self-center rounded-lg shadow-md">
          <CustomImage
            image={value}
            width={720}
            height={379}
            className="rounded-lg"
            mode="cover"
            sizes={IMAGE_SIZES.articleInline}
          />
          {(value.attribution || value.credit) && (
            <figcaption className="text-muted-foreground flex items-center gap-2 text-sm">
              <CameraIcon className="h-4 w-4" />
              <span>Source: {value.credit ?? value.attribution}</span>
            </figcaption>
          )}
        </figure>
      );
    },
    table: ({ value }) => <PortableTable value={value} />,
    pullQuote: ({ value }: PortableTextTypeComponentProps<PullQuoteValue>) => {
      if (!value.quote) return null;
      return (
        <figure className="not-prose my-8 border-l-4 border-primary pl-5">
          <blockquote className="font-serif text-2xl font-semibold leading-snug">
            “{value.quote}”
          </blockquote>
          {value.attribution ? (
            <figcaption className="mt-3 text-sm text-muted-foreground">
              {value.attribution}
              {value.role ? `, ${value.role}` : ""}
            </figcaption>
          ) : null}
        </figure>
      );
    },
    callout: ({ value }: PortableTextTypeComponentProps<CalloutValue>) => {
      if (!value.text) return null;
      return (
        <aside className="not-prose my-6 rounded-xl border bg-muted/40 p-5">
          <p className="kicker text-primary">
            {CALLOUT_LABEL[value.kind ?? "context"]}
          </p>
          {value.title ? (
            <p className="mt-1 font-display text-xl font-bold uppercase leading-tight">
              {value.title}
            </p>
          ) : null}
          <p className="mt-2 whitespace-pre-line font-serif text-base leading-relaxed">
            {value.text}
          </p>
        </aside>
      );
    },
    relatedArticle: ({
      value,
    }: PortableTextTypeComponentProps<RelatedArticleValue>) => (
      <RelatedArticleCard label={value.label} post={value.post} />
    ),
    // Shown as a captioned link: third-party embed scripts aren't loaded.
    socialEmbed: ({
      value,
    }: PortableTextTypeComponentProps<SocialEmbedValue>) => {
      if (!value.url) return null;
      const host = socialHost(value.url);
      return (
        <aside className="not-prose my-6 rounded-xl border p-4">
          {value.caption ? (
            <p className="font-serif text-base">{value.caption}</p>
          ) : null}
          <a
            href={value.url}
            rel="noreferrer noopener"
            target="_blank"
            className="mt-2 inline-block text-sm text-primary underline underline-offset-2"
          >
            View the post{host ? ` on ${host}` : ""}
          </a>
        </aside>
      );
    },
    bracketEmbed: ({
      value,
    }: PortableTextTypeComponentProps<BracketEmbedValue>) => (
      <BracketEmbed editionId={value.editionId} caption={value.caption} />
    ),
    youtubeEmbed: ({
      value,
    }: PortableTextTypeComponentProps<YoutubeEmbedValue>) => {
      return <YouTubeEmbedComponent {...value} />;
    },
  },
};

export function RichText<T>({
  richText,
  className,
}: {
  richText?: T | null;
  className?: string;
}) {
  if (!richText) return null;

  return (
    <div
      className={cn(
        "prose prose-zinc prose-a:underline-offset-2 dark:prose-invert md:prose-lg max-w-none",
        className,
      )}
    >
      <PortableText
        value={richText as PortableTextBlock[]}
        components={richTextComponents}
        onMissingComponent={(_, { nodeType, type }) =>
          console.log("missing component", nodeType, type)
        }
      />
    </div>
  );
}
