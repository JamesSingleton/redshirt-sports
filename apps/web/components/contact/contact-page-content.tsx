import { Newspaper } from "lucide-react";
import Link from "next/link";

import { SiteBreadcrumb } from "@/components/chrome/site-breadcrumb";
import { ContactForm } from "@/components/contact/contact-form";
import { SiteSocialButtons } from "@/components/contact/site-social-buttons";
import { rankingsMethodologyHref } from "@/lib/rankings-nav";

export type ContactOption = {
  title: string;
  description: string;
  subject: string;
};

const DEFAULT_OPTIONS: ContactOption[] = [
  {
    title: "General",
    description: "Questions about the site or anything else.",
    subject: "General",
  },
  {
    title: "News tips",
    description: "Something we should cover? Tips can be anonymous.",
    subject: "News tip",
  },
  {
    title: "Corrections",
    description: "Spotted an error? Send the article URL and the fix.",
    subject: "Correction",
  },
  {
    title: "Advertising & partnerships",
    description: "Sponsorships, ads and content partnerships.",
    subject: "Advertising",
  },
  {
    title: "Poll & voter inquiries",
    description: "Questions about the Top 25, ballots or the voter panel.",
    subject: "Poll inquiry",
  },
];

export function ContactPageContent({
  contactEmail,
  socialLinks,
}: {
  contactEmail: string;
  socialLinks: {
    facebook?: string | null;
    twitter?: string | null;
    youtube?: string | null;
    instagram?: string | null;
    bluesky?: string | null;
    threads?: string | null;
  } | null;
}) {
  const methodologyHref = rankingsMethodologyHref("football", "fcs");

  return (
    <main id="main" className="mx-auto max-w-site px-4 pt-5 lg:px-6">
      <SiteBreadcrumb
        items={[{ label: "Home", href: "/" }, { label: "Contact" }]}
      />

      <section className="border-b pb-10 pt-6" data-block="hero">
        <div className="max-w-3xl">
          <div className="kicker text-primary">Contact</div>
          <h1 className="mt-2 font-display text-[2.6rem] font-extrabold uppercase leading-none lg:text-headline-lg">
            Get in touch
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Tips, corrections, partnerships or poll questions: here&apos;s how
            to reach the Redshirt Sports team.
          </p>
        </div>
      </section>

      <section className="border-b py-10" data-block="cardGrid">
        <h2 className="font-display text-3xl font-extrabold uppercase">
          Who to contact
        </h2>
        <ul className="mt-5 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,15rem),1fr))]">
          {DEFAULT_OPTIONS.map((option) => (
            <li
              key={option.title}
              className="flex flex-col rounded-xl border bg-card p-4"
            >
              <h3 className="font-display text-xl font-bold uppercase leading-tight">
                {option.title}
              </h3>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">
                {option.description}
              </p>
              <a
                href={`mailto:${contactEmail}?subject=${encodeURIComponent(option.subject)}`}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                <Newspaper className="size-4 shrink-0" aria-hidden />
                {contactEmail}
                <span className="sr-only"> (subject: {option.subject})</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-b py-10" data-block="contactForm">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <ContactForm contactEmail={contactEmail} />
          <div className="grid content-start gap-4">
            <h2 className="font-display text-3xl font-extrabold uppercase">
              Before you write
            </h2>
            <ul className="grid gap-2 text-sm text-muted-foreground">
              <li>
                Corrections: include the article link and what should change.
                See our{" "}
                <Link
                  href="/legal/corrections"
                  className="text-primary underline"
                >
                  corrections policy
                </Link>
                .
              </li>
              <li>
                Poll questions: read{" "}
                <Link href={methodologyHref} className="text-primary underline">
                  how the Top 25 works
                </Link>{" "}
                first.
              </li>
              <li>We can&apos;t share voter contact details.</li>
            </ul>
          </div>
        </div>
      </section>

      {socialLinks ? (
        <section className="border-b py-10" data-block="socialLinks">
          <h2 className="font-display text-3xl font-extrabold uppercase">
            Follow Redshirt Sports
          </h2>
          <SiteSocialButtons socialLinks={socialLinks} className="mt-4" />
        </section>
      ) : null}
    </main>
  );
}
