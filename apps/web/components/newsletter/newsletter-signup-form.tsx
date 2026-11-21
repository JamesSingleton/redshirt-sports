"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import { Input } from "@redshirt-sports/ui/components/input";
import { Label } from "@redshirt-sports/ui/components/label";
import { cn } from "@redshirt-sports/ui/lib/utils";
import { usePathname } from "next/navigation";
import { type FormEvent, useEffect, useId, useState } from "react";

import { confirmState, type SignupState } from "@/lib/newsletter/signup";

const FAILED: SignupState = {
  status: "error",
  message: "Something went wrong. Check your connection and try again.",
};

/**
 * Catches an empty or malformed address, or no emails ticked, before a
 * round trip. The server checks the same things.
 */
function checkForm(form: HTMLFormElement): SignupState | null {
  const email = form.elements.namedItem("email") as HTMLInputElement;
  if (!email.checkValidity()) {
    email.focus();
    return { status: "error", message: "Enter a valid email address." };
  }
  const choices = form.querySelectorAll<HTMLInputElement>(
    'fieldset input[type="checkbox"]',
  );
  if (choices.length > 0 && ![...choices].some((box) => box.checked)) {
    return { status: "error", message: "Pick at least one email to get." };
  }
  return null;
}

async function postSignup(form: HTMLFormElement): Promise<SignupState> {
  try {
    const response = await fetch("/api/newsletter/subscribe", {
      method: "POST",
      body: new FormData(form),
    });
    return (await response.json()) as SignupState;
  } catch {
    return FAILED;
  }
}

const TONES = {
  default: {
    input: "",
    status: "text-muted-foreground",
    error: "text-destructive",
  },
  /** On the footer's ink background, in both themes. */
  inverse: {
    input:
      "border-ink-foreground/25 bg-ink-foreground/5 text-ink-foreground placeholder:text-ink-foreground/50 dark:bg-ink-foreground/5",
    status: "text-ink-foreground/70",
    error: "text-[oklch(0.8_0.12_25)]",
  },
} as const;

/** Email in, confirm link out. The message line keeps its height, so nothing moves. */
export type PollOption = { id: string; label: string };

function Choice({
  name,
  value,
  label,
  description,
  defaultChecked,
}: {
  name: string;
  value?: string;
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-3 has-checked:border-primary">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 shrink-0 accent-primary"
      />
      <span className="grid gap-0.5">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}

export function NewsletterSignupForm({
  tone = "default",
  showConfirmStatus = false,
  polls,
}: {
  tone?: keyof typeof TONES;
  /** On /newsletter: say how the confirm link went (`?status=`). */
  showConfirmStatus?: boolean;
  /**
   * Show the email choices: the weekly issue (ticked) and an opt-in alert
   * per poll. Without it the form signs up for the weekly issue only.
   */
  polls?: PollOption[];
}) {
  const colors = TONES[tone];
  const id = useId();
  const [state, setState] = useState<SignupState>({ status: "idle" });

  // The footer's form outlives client navigations (it's in the root layout),
  // so a message about the last page's attempt clears on the next page.
  const pathname = usePathname();
  const [messagePath, setMessagePath] = useState(pathname);
  if (pathname !== messagePath) {
    setMessagePath(pathname);
    setState({ status: "idle" });
  }

  // Read after mount so the page stays static; the status line already has
  // its height, so the message fills it without moving anything.
  useEffect(() => {
    if (!showConfirmStatus) return;
    const url = new URL(window.location.href);
    const next = confirmState(url.searchParams.get("status"));
    if (next.status === "idle") return;
    setState(next);
    // A refresh or a shared URL shouldn't repeat the message.
    url.searchParams.delete("status");
    window.history.replaceState(window.history.state, "", url);
  }, [showConfirmStatus]);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const problem = checkForm(form);
    if (problem) {
      setState(problem);
      return;
    }
    setPending(true);
    const next = await postSignup(form);
    setState(next);
    setPending(false);
    if (next.status === "sent") form.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-2" noValidate>
      {polls ? (
        <fieldset className="mb-4 grid gap-2">
          <legend className="mb-2 text-sm font-semibold">
            Choose your emails
          </legend>
          <input type="hidden" name="choices" value="1" />
          <Choice
            name="digest"
            label="The Week in College Sports"
            description="Every story from the week, Sunday mornings."
            defaultChecked
          />
          {polls.map((poll) => (
            <Choice
              key={poll.id}
              name="poll"
              value={poll.id}
              label={`${poll.label} alerts`}
              description="The poll the moment it's published, with who moved."
            />
          ))}
        </fieldset>
      ) : null}
      <Label htmlFor={`${id}-email`}>Email address</Label>
      <div className="flex gap-2">
        <Input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          required
          aria-describedby={`${id}-status`}
          aria-invalid={state.status === "error" || undefined}
          className={cn("min-w-0 flex-1", colors.input)}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Signing up…" : "Sign up"}
        </Button>
      </div>
      {/* Hidden from people; a bot that fills every field gets a fake thank-you. */}
      <div
        aria-hidden
        className="absolute -left-[9999px] h-px w-px overflow-hidden"
      >
        <label htmlFor={`${id}-website`}>Website</label>
        <input
          id={`${id}-website`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <p
        id={`${id}-status`}
        role="status"
        className={cn(
          "min-h-10 text-sm",
          state.status === "error" ? colors.error : colors.status,
        )}
      >
        {state.status === "idle" ? "" : state.message}
      </p>
    </form>
  );
}
