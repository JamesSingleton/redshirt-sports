"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import { Input } from "@redshirt-sports/ui/components/input";
import { useActionState } from "react";

import { newsletterSubscribe } from "@/actions/newsletter-subscribe";

type State = { success?: boolean; error?: string } | null;

async function action(_prev: State, formData: FormData): Promise<State> {
  return newsletterSubscribe(formData);
}

const PITCH =
  "Get the Redshirt Sports Top 25, ballots and FCS bracket in your inbox every week.";

export function NewsletterSignup({
  variant,
}: {
  variant: "compact" | "inline";
}) {
  const [state, formAction, isPending] = useActionState(action, null);

  if (state?.success) {
    return (
      <div
        className={
          variant === "compact"
            ? "py-4 text-sm text-ink-foreground/80"
            : "rounded-lg border bg-muted/50 px-6 py-8 text-center"
        }
        role="status"
      >
        <p className="font-medium">Check your inbox to confirm.</p>
      </div>
    );
  }

  return (
    <div
      className={
        variant === "compact"
          ? "py-4"
          : "rounded-lg border bg-muted/50 px-6 py-8 text-center"
      }
    >
      <p
        className={
          variant === "compact"
            ? "mb-3 text-sm text-ink-foreground/80"
            : "mx-auto mb-4 max-w-md text-sm text-muted-foreground"
        }
      >
        {PITCH}
      </p>
      <form
        action={formAction}
        className={
          variant === "compact" ? "flex gap-2" : "mx-auto flex max-w-md gap-2"
        }
      >
        {/* Honeypot — hidden from humans and assistive tech */}
        <input
          type="text"
          name="url"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute h-0 w-0 overflow-hidden opacity-0"
        />
        <Input
          type="email"
          name="email"
          placeholder="you@example.com"
          required
          aria-label="Email address"
          className={
            variant === "compact"
              ? "bg-ink text-ink-foreground placeholder:text-ink-foreground/50 border-ink-foreground/20"
              : ""
          }
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Subscribing\u2026" : "Subscribe"}
        </Button>
      </form>
      {state?.error ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
