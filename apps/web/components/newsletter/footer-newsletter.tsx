import { NewsletterSignupForm } from "./newsletter-signup-form";

/**
 * The signup band atop the footer. No data, so the footer's skeleton renders
 * it too and the band never moves when the footer loads.
 */
export function FooterNewsletter() {
  return (
    <section
      aria-labelledby="footer-newsletter-heading"
      // /newsletter has the form front and center; don't repeat it below.
      className="border-b border-ink-foreground/10 [body:has([data-newsletter-page])_&]:hidden"
    >
      <div className="mx-auto grid max-w-site gap-6 px-4 py-10 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:px-6">
        <div>
          <h3
            id="footer-newsletter-heading"
            className="font-display text-2xl font-extrabold"
          >
            The Week in College Sports
          </h3>
          <p className="mt-2 max-w-md text-sm text-ink-foreground/70">
            The week's college football and basketball stories, rankings and
            projections, in your inbox every Sunday morning.
          </p>
        </div>
        <NewsletterSignupForm tone="inverse" />
      </div>
    </section>
  );
}
