import { isNewsletterEnabled } from "@/lib/newsletter";
import { NewsletterSignup } from "./newsletter-signup";

/**
 * Renders the newsletter signup form (inside an optional wrapper) when the
 * feature is enabled, and nothing at all otherwise. Safe for static / ISR
 * pages: the enabled check reads only env vars.
 */
export function NewsletterGate({
  variant,
  className,
}: {
  variant: "compact" | "inline";
  className?: string;
}) {
  if (!isNewsletterEnabled()) return null;
  return (
    <div className={className}>
      <NewsletterSignup variant={variant} />
    </div>
  );
}
