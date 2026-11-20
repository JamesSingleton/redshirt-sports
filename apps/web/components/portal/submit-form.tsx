"use client";

import {
  PLAYER_SUBMITTER_ROLES,
  PORTAL_SPORT_SLUGS,
  SUBMISSION_MOVE_LABELS,
  SUBMISSION_MOVES,
  SUBMITTER_ROLE_LABELS,
} from "@redshirt-sports/db/portal";
import { Button } from "@redshirt-sports/ui/components/button";
import { Input } from "@redshirt-sports/ui/components/input";
import { cn } from "@redshirt-sports/ui/lib/utils";
import { type ReactNode, useActionState, useEffect, useRef } from "react";

import { submitPortalMove } from "@/actions/submit-portal-move";
import { portalSportLabel } from "@/components/portal/wire-format";
import type { SubmitField, SubmitState } from "@/lib/portal-submit";

const IDLE: SubmitState = { status: "idle" };

const control =
  "border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-2 aria-invalid:border-destructive";

/** A labelled control with its error message wired for screen readers. */
function Field({
  name,
  label,
  hint,
  error,
  required = false,
  children,
}: {
  name: SubmitField;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (props: {
    id: string;
    name: SubmitField;
    required: boolean;
    "aria-invalid": boolean | undefined;
    "aria-describedby": string | undefined;
  }) => ReactNode;
}) {
  const id = `submit-${name}`;
  const describedBy =
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required ? null : (
          <span className="text-muted-foreground font-normal"> (optional)</span>
        )}
      </label>
      {children({
        id,
        name,
        required,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
      })}
      {hint ? (
        <p id={`${id}-hint`} className="text-muted-foreground text-xs">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-destructive text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The public "report a move" form. Posts to a server action (so it works
 * before the page hydrates), which validates everything again.
 */
export function SubmitForm() {
  const [state, action, pending] = useActionState(submitPortalMove, IDLE);
  const status = useRef<HTMLParagraphElement>(null);
  const value = (name: SubmitField) => state.values?.[name] ?? "";
  const error = (name: SubmitField) => state.errors?.[name];

  // Bring the result into view and to screen readers' attention.
  useEffect(() => {
    if (state.status !== "idle") status.current?.focus();
  }, [state]);

  if (state.status === "sent") {
    return (
      <p
        ref={status}
        tabIndex={-1}
        role="status"
        className="bg-card rounded-xl border p-5 text-sm font-medium outline-none"
      >
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-8" noValidate>
      {state.message ? (
        <p
          ref={status}
          tabIndex={-1}
          role="alert"
          className="border-destructive/40 bg-destructive/10 rounded-md border p-3 text-sm outline-none"
        >
          {state.message}
        </p>
      ) : null}

      <fieldset className="flex flex-col gap-4">
        <legend className="font-display mb-3 text-xl font-extrabold">
          The player
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name="playerFirstName"
            label="First name"
            required
            error={error("playerFirstName")}
          >
            {(props) => (
              <Input
                {...props}
                defaultValue={value("playerFirstName")}
                maxLength={80}
                autoComplete="off"
              />
            )}
          </Field>
          <Field
            name="playerLastName"
            label="Last name"
            required
            error={error("playerLastName")}
          >
            {(props) => (
              <Input
                {...props}
                defaultValue={value("playerLastName")}
                maxLength={80}
                autoComplete="off"
              />
            )}
          </Field>
          <Field
            name="sportSlug"
            label="Sport"
            required
            error={error("sportSlug")}
          >
            {(props) => (
              <select
                {...props}
                className={control}
                defaultValue={value("sportSlug")}
              >
                <option value="">Choose a sport</option>
                {PORTAL_SPORT_SLUGS.map((slug) => (
                  <option key={slug} value={slug}>
                    {portalSportLabel(slug)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field name="position" label="Position" error={error("position")}>
            {(props) => (
              <Input
                {...props}
                defaultValue={value("position")}
                maxLength={40}
              />
            )}
          </Field>
        </div>
        <Field
          name="currentSchool"
          label="Current school"
          hint="The school they're at now, or were at before this move."
          required
          error={error("currentSchool")}
        >
          {(props) => (
            <Input
              {...props}
              defaultValue={value("currentSchool")}
              maxLength={120}
            />
          )}
        </Field>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="font-display mb-3 text-xl font-extrabold">
          What happened
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="move" label="The move" required error={error("move")}>
            {(props) => (
              <select
                {...props}
                className={control}
                defaultValue={value("move")}
              >
                <option value="">Choose one</option>
                {SUBMISSION_MOVES.map((move) => (
                  <option key={move} value={move}>
                    {SUBMISSION_MOVE_LABELS[move]}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field name="happenedOn" label="Date" error={error("happenedOn")}>
            {(props) => (
              <Input
                {...props}
                type="date"
                defaultValue={value("happenedOn")}
              />
            )}
          </Field>
        </div>
        <Field
          name="destinationSchool"
          label="New school"
          hint="Needed for a commitment."
          error={error("destinationSchool")}
        >
          {(props) => (
            <Input
              {...props}
              defaultValue={value("destinationSchool")}
              maxLength={120}
            />
          )}
        </Field>
        <Field
          name="link"
          label="Link"
          hint="A post or announcement that confirms it. Starts with https://"
          error={error("link")}
        >
          {(props) => (
            <Input
              {...props}
              type="url"
              inputMode="url"
              placeholder="https://"
              defaultValue={value("link")}
              maxLength={500}
            />
          )}
        </Field>
        <Field
          name="note"
          label="Anything else"
          // Players paste their NCAA (Eligibility Center) ID out of habit; we don't keep it.
          hint={`Needed if you chose "${SUBMISSION_MOVE_LABELS.other}". Please don't include your NCAA ID or any other account numbers. We don't need them.`}
          error={error("note")}
        >
          {(props) => (
            <textarea
              {...props}
              className={cn(control, "h-28 py-2")}
              defaultValue={value("note")}
              maxLength={1000}
            />
          )}
        </Field>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="font-display mb-1 text-xl font-extrabold">
          About you
        </legend>
        <p className="text-muted-foreground mb-2 text-sm">
          So an editor can follow up. We never publish this.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name="submitterRole"
            label="You are"
            required
            error={error("submitterRole")}
          >
            {(props) => (
              <select
                {...props}
                className={control}
                defaultValue={value("submitterRole")}
              >
                <option value="">Choose one</option>
                {PLAYER_SUBMITTER_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {SUBMITTER_ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field
            name="submitterName"
            label="Your name"
            required
            error={error("submitterName")}
          >
            {(props) => (
              <Input
                {...props}
                defaultValue={value("submitterName")}
                maxLength={120}
                autoComplete="name"
              />
            )}
          </Field>
        </div>
        <Field
          name="submitterEmail"
          label="Your email"
          required
          error={error("submitterEmail")}
        >
          {(props) => (
            <Input
              {...props}
              type="email"
              defaultValue={value("submitterEmail")}
              maxLength={254}
              autoComplete="email"
            />
          )}
        </Field>
      </fieldset>

      {/* A trap for scripts that fill every field. Hidden from people and assistive tech. */}
      <div className="hidden" aria-hidden>
        <label htmlFor="submit-website">Website</label>
        <input
          id="submit-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Sending…" : "Send to the editors"}
        </Button>
      </div>
    </form>
  );
}
