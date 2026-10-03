import Link from "next/link";
import type { ComponentProps } from "react";

import type { NavLink } from "@/lib/navigation";

type NavAnchorProps = Omit<ComponentProps<typeof Link>, "href"> & {
  link: Pick<NavLink, "href" | "openInNewTab">;
};

export function NavAnchor({ link, ...props }: NavAnchorProps) {
  return (
    <Link
      href={link.href}
      {...(link.openInNewTab
        ? { target: "_blank", rel: "noopener noreferrer" }
        : null)}
      {...props}
    />
  );
}
