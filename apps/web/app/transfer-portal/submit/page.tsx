import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SubmitForm } from "@/components/portal/submit-form";
import { portalIsPublic } from "@/lib/portal-data";

const TITLE = "Report a Transfer Portal Move";
const DESCRIPTION =
  "Players, parents, and coaches: tell Redshirt Sports about a transfer portal entry, commitment, or withdrawal. An editor reviews every submission.";

// Not linked anywhere on the site for now: reached only by a shared link,
// so it stays out of search too.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/transfer-portal/submit" },
  robots: { index: false, follow: false },
};

export default function SubmitPortalMovePage() {
  // Static: the switch is read at build time, so a hidden portal is a real 404.
  if (!portalIsPublic()) notFound();
  return (
    <div className="max-w-site mx-auto px-4 pt-6 pb-12 lg:px-6">
      <div className="max-w-2xl">
        <nav
          className="text-muted-foreground flex items-center gap-1 text-xs"
          aria-label="Breadcrumb"
        >
          <Link
            href="/transfer-portal"
            className="hover:text-foreground"
            prefetch={false}
          >
            Transfer Portal
          </Link>
          <span aria-hidden>›</span>
          <span className="text-foreground" aria-current="page">
            Report a move
          </span>
        </nav>
        <h1 className="font-display mt-3 text-[2.1rem] leading-[0.95] font-extrabold uppercase sm:text-[2.6rem]">
          Report a move
        </h1>
        <p className="text-muted-foreground mt-3 mb-8 text-sm">
          Entered the portal, committed somewhere, or decided to stay? Tell us
          here. An editor checks every submission before anything appears on the
          site, so it won&apos;t show up right away.
        </p>
        <SubmitForm />
      </div>
    </div>
  );
}
