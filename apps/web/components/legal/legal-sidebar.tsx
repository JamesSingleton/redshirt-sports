import { ChevronDown } from "lucide-react";
import Link from "next/link";

import type { LegalHeading } from "./headings";

type LegalDocumentLink = {
  _id: string;
  title: string;
  slug: string;
};

function TableOfContents({ headings }: { headings: LegalHeading[] }) {
  return (
    <ol className="border-border space-y-2.5 border-l text-sm">
      {headings.map((heading) => (
        <li key={heading.id}>
          <a
            href={`#${heading.id}`}
            className="text-muted-foreground hover:border-foreground hover:text-foreground -ml-px block border-l border-transparent pl-4 transition-colors"
          >
            {heading.text}
          </a>
        </li>
      ))}
    </ol>
  );
}

export function LegalMobileTableOfContents({
  headings,
}: {
  headings: LegalHeading[];
}) {
  const sections = headings.filter((heading) => heading.level === 2);
  if (sections.length < 2) return null;

  return (
    <details className="group bg-muted/40 rounded-lg border p-4 lg:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold [&::-webkit-details-marker]:hidden">
        On this page
        <ChevronDown
          className="text-muted-foreground size-4 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="mt-4">
        <TableOfContents headings={sections} />
      </div>
    </details>
  );
}

export function LegalSidebar({
  headings,
  otherDocuments,
}: {
  headings: LegalHeading[];
  otherDocuments: LegalDocumentLink[];
}) {
  const sections = headings.filter((heading) => heading.level === 2);

  return (
    <aside className="space-y-10 text-sm lg:sticky lg:top-24 lg:self-start">
      {sections.length >= 2 && (
        <nav aria-labelledby="legal-toc-heading" className="hidden lg:block">
          <h2
            id="legal-toc-heading"
            className="mb-4 text-xs font-semibold tracking-wider uppercase"
          >
            On this page
          </h2>
          <TableOfContents headings={sections} />
        </nav>
      )}
      {otherDocuments.length > 0 && (
        <nav aria-labelledby="legal-docs-heading">
          <h2
            id="legal-docs-heading"
            className="mb-4 text-xs font-semibold tracking-wider uppercase"
          >
            Other legal documents
          </h2>
          <ul className="space-y-2.5">
            {otherDocuments.map((doc) => (
              <li key={doc._id}>
                <Link
                  href={`/legal/${doc.slug}`}
                  prefetch={false}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {doc.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <div className="bg-muted/40 rounded-lg border p-4">
        <p className="font-semibold">Questions?</p>
        <p className="text-muted-foreground mt-1">
          If anything here is unclear,{" "}
          <Link
            href="/contact"
            prefetch={false}
            className="text-foreground font-medium underline underline-offset-4"
          >
            get in touch
          </Link>{" "}
          and we&apos;ll help.
        </p>
      </div>
    </aside>
  );
}
