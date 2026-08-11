import type { QueryGlobalSeoSettingsResult } from "@redshirt-sports/sanity/types";
import Image from "next/image";
import Link from "next/link";

import type { Maybe } from "@/types";
import CustomImage from "./sanity-image";

const LOGO_URL =
  "https://cdn.sanity.io/images/8pbt9f8w/production/6ed24cde242b41912e2d06bf2ca7da9abdf97c06-4347x2855.svg";

interface LogoProps {
  src?: Maybe<string>;
  image?: Maybe<NonNullable<QueryGlobalSeoSettingsResult>["logo"]>;
  alt?: Maybe<string>;
  width?: number;
  height?: number;
  priority?: boolean;
}

export function Logo({
  src,
  alt = "logo",
  image,
  width = 70,
  height = 40,
  priority = true,
}: LogoProps) {
  return (
    <Link href="/" prefetch={false}>
      {image ? (
        <CustomImage
          image={image}
          width={width}
          className="h-10 w-auto"
          height={height}
          priority={priority}
          quality={100}
        />
      ) : (
        <Image
          src={src ?? LOGO_URL}
          alt={alt ?? "logo"}
          width={width}
          className="h-10 w-auto"
          height={height}
          loading="eager"
          priority={priority}
          decoding="sync"
        />
      )}
    </Link>
  );
}
