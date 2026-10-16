import type { SanityImageData } from "@redshirt-sports/sanity/image";
import { cn } from "@redshirt-sports/ui/lib/utils";
import { CameraIcon } from "lucide-react";
import Link from "next/link";
import {
  PortableText,
  type PortableTextBlock,
  type PortableTextComponentProps,
  type PortableTextComponents,
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

function SmartLink({
  href,
  blank,
  children,
}: {
  href?: string;
  blank?: boolean;
  children: React.ReactNode;
}) {
  if (!href) return <>{children}</>;
  const external = /^(https?:|mailto:|tel:)/.test(href);
  if (!external) return <Link href={href}>{children}</Link>;
  return (
    <a
      href={href}
      {...(blank ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

export const marks: PortableTextComponents["marks"] = {
  // Assumes your GROQ resolves customUrl into { href, blank }
  customLink: ({ value, children }) => (
    <SmartLink href={value?.customLink?.href} blank={value?.customLink?.blank}>
      {children}
    </SmartLink>
  ),
  link: ({ value, children }) => (
    <SmartLink href={value?.href} blank={value?.blank}>
      {children}
    </SmartLink>
  ),
  internalLink: ({ value, children }) => (
    <SmartLink href={value?.href}>{children}</SmartLink>
  ),
};

export const richTextComponents: Partial<PortableTextReactComponents> = {
  marks,
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
        <figure className="not-prose my-2 flex flex-col items-center self-center rounded-lg shadow-md">
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
