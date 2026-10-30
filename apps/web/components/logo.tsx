import type { QueryGlobalSeoSettingsResult } from "@redshirt-sports/sanity/types";
import Image from "next/image";
import Link from "next/link";

import type { Maybe } from "@/types";
import CustomImage from "./sanity-image";

const LOGO_URL =
  "https://cdn.sanity.io/images/s6kuy1ts/production/68c438f68264717e93c7ba1e85f1d0c4b58b33c2-1200x621.svg";

interface LogoProps {
  src?: Maybe<string>;
  image?: Maybe<NonNullable<QueryGlobalSeoSettingsResult>["logo"]>;
  footerLogo?: Maybe<NonNullable<QueryGlobalSeoSettingsResult>["footerLogo"]>;
  footerLogoDarkMode?: Maybe<
    NonNullable<QueryGlobalSeoSettingsResult>["footerLogoDarkMode"]
  >;
  alt?: Maybe<string>;
  width?: number;
  height?: number;
  priority?: boolean;
  /** Header wordmark sizing (mockup default). */
  variant?: "header" | "footer";
}

export function Logo({
  src,
  alt = "Redshirt Sports",
  image,
  footerLogo,
  footerLogoDarkMode,
  width,
  height,
  priority = true,
  variant = "header",
}: LogoProps) {
  const label = alt ?? "Redshirt Sports";

  const headerWordmark =
    footerLogo && footerLogoDarkMode ? (
      <>
        <CustomImage
          image={footerLogo}
          alt={label}
          width={width ?? 169}
          height={height ?? 28}
          className="h-6 w-auto lg:h-7 dark:hidden"
          priority={priority}
          quality={100}
        />
        <CustomImage
          image={footerLogoDarkMode}
          alt={label}
          width={width ?? 169}
          height={height ?? 28}
          className="hidden h-6 w-auto lg:h-7 dark:block"
          priority={priority}
          quality={100}
        />
      </>
    ) : null;

  const footerWordmark = footerLogoDarkMode ? (
    <CustomImage
      image={footerLogoDarkMode}
      alt={label}
      width={width ?? 193}
      height={height ?? 32}
      className="h-8 w-auto"
      priority={priority}
      quality={100}
    />
  ) : null;

  const markFallback = image ? (
    <CustomImage
      image={image}
      alt={label}
      width={width ?? 70}
      height={height ?? 40}
      className="h-10 w-auto"
      priority={priority}
      quality={100}
    />
  ) : (
    <Image
      src={src ?? LOGO_URL}
      alt={label}
      width={width ?? 70}
      height={height ?? 40}
      className="h-10 w-auto"
      loading="eager"
      priority={priority}
      decoding="sync"
    />
  );

  let logoContent = markFallback;
  if (variant === "footer" && footerWordmark) {
    logoContent = footerWordmark;
  } else if (variant === "header" && headerWordmark) {
    logoContent = headerWordmark;
  }

  return (
    <Link href="/" prefetch={false} className="inline-flex shrink-0">
      {logoContent}
    </Link>
  );
}
