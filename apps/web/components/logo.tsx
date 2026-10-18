import type { QueryGlobalSeoSettingsResult } from "@redshirt-sports/sanity/types";
import { cn } from "@redshirt-sports/ui/lib/utils";
import Image from "next/image";
import Link from "next/link";

import type { Maybe } from "@/types";
import CustomImage from "./sanity-image";

interface LogoProps {
  /** Explicit image URL; renders a raster/SVG logo instead of the wordmark. */
  src?: Maybe<string>;
  /** Sanity image fallback; renders instead of the wordmark when provided. */
  image?: Maybe<NonNullable<QueryGlobalSeoSettingsResult>["logo"]>;
  alt?: Maybe<string>;
  width?: number;
  height?: number;
  priority?: boolean;
  variant?: "default" | "ink";
  className?: string;
}

export function Logo({
  src,
  alt = "logo",
  image,
  width = 70,
  height = 40,
  priority = true,
  variant = "default",
  className,
}: LogoProps) {
  const label = alt ?? "logo";

  return (
    <Link
      href="/"
      prefetch={false}
      aria-label={image || src ? undefined : "Redshirt Sports home"}
      className={cn("inline-flex shrink-0 items-center", className)}
    >
      {image ? (
        <CustomImage
          image={image}
          width={width}
          className="h-10 w-auto"
          height={height}
          priority={priority}
          quality={100}
        />
      ) : src ? (
        <Image
          src={src}
          alt={label}
          width={width}
          className="h-10 w-auto"
          height={height}
          loading="eager"
          priority={priority}
          decoding="sync"
        />
      ) : (
        <span
          className={cn(
            "font-display text-[1.45rem] leading-none font-extrabold tracking-tight uppercase italic lg:text-[1.8rem]",
            variant === "ink" ? "text-ink-foreground" : "text-foreground",
          )}
        >
          Redshirt<span className="text-primary">Sports</span>
        </span>
      )}
    </Link>
  );
}
