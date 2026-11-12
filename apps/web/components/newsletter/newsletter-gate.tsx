import { isNewsletterEnabled } from "@/lib/newsletter";
import { NewsletterSignup } from "./newsletter-signup";

/**
 * Renders the newsletter signup form when the feature is enabled,
 * nothing otherwise. Safe for static / ISR pages — the enabled check
 * reads only env vars, never headers() or cookies().
 */
export function NewsletterGate({ variant }: { variant: "compact" | "inline" }) {
  if (!isNewsletterEnabled()) return null;
  return <NewsletterSignup variant={variant} />;
}
