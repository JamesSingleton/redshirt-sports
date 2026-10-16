// components/portable-text-marks.tsx

import type { PortableTextComponents } from "@portabletext/react";
import Link from "next/link";

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

export const marks: NonNullable<PortableTextComponents["marks"]> = {
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
