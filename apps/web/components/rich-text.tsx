import type { SanityImageData } from "@redshirt-sports/sanity/image";
import { cn } from "@redshirt-sports/ui/lib/utils";
import { CameraIcon } from "lucide-react";
import Link from "next/link";
import {
  PortableText,
  type PortableTextBlock,
  type PortableTextComponentProps,
  type PortableTextMarkComponentProps,
  type PortableTextReactComponents,
  type PortableTextTypeComponentProps,
} from "next-sanity";

import CustomImage, { IMAGE_SIZES } from "@/components/sanity-image";
import { ReactTweet as Tweet } from "@/components/tweet";
import { PortableTable } from "./portable-table";
import { YouTubeEmbedComponent } from "./youtube-embed";

type TwitterEmbedValue = {
  _type: "twitter";
  id: string;
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

type SiteLinkMarkValue = {
  _type: string;
  href?: string;
  openInNewTab?: boolean;
};

type BlockChildrenProps = Pick<
  PortableTextComponentProps<PortableTextBlock>,
  "children"
>;

function SiteLinkMark({
  children,
  value,
}: PortableTextMarkComponentProps<SiteLinkMarkValue>) {
  const href = value?.href;
  const openInNewTab = value?.openInNewTab;
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
    link: ({ value, children }: PortableTextMarkComponentProps) => {
      return value?.blank ? (
        <a
          className="hover:text-muted-foreground underline"
          href={value?.href}
          rel="noreferrer noopener"
          target="_blank"
          aria-label={`Opens ${value?.href} in a new tab`}
          title={`Opens ${value?.href} in a new tab`}
        >
          {children}
        </a>
      ) : (
        <a className="hover:text-muted-foreground underline" href={value?.href}>
          {children}
        </a>
      );
    },
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
