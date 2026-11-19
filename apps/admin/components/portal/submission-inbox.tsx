"use client";

import {
  PLAYER_SUBMISSION_STATUSES,
  SUBMISSION_MOVE_LABELS,
  SUBMITTER_ROLE_LABELS,
} from "@redshirt-sports/db/portal";
import { Badge } from "@redshirt-sports/ui/components/badge";
import { Button } from "@redshirt-sports/ui/components/button";
import { toast } from "@redshirt-sports/ui/components/toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { reviewSubmission, type SubmissionInbox } from "@/actions/portal";

type Submission = SubmissionInbox["submissions"][number];

export const SUBMISSION_STATUS_LABELS: Record<
  (typeof PLAYER_SUBMISSION_STATUSES)[number],
  string
> = {
  new: "New",
  accepted: "Accepted",
  rejected: "Rejected",
  spam: "Spam",
};

const sentOn = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function SubmissionCard({ submission }: { submission: Submission }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const { payload } = submission;
  const close = (status: "accepted" | "rejected" | "spam") =>
    start(async () => {
      const result = await reviewSubmission({ id: submission.id, status });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(`Marked ${SUBMISSION_STATUS_LABELS[status].toLowerCase()}`);
      router.refresh();
    });
  const role =
    SUBMITTER_ROLE_LABELS[
      submission.submitterRole as keyof typeof SUBMITTER_ROLE_LABELS
    ] ?? submission.submitterRole;

  return (
    <li className="flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-medium">
            {payload
              ? `${payload.playerFirstName} ${payload.playerLastName}`
              : "Unreadable submission"}
          </h2>
          <p className="text-muted-foreground text-xs">
            #{submission.id} · {sentOn.format(new Date(submission.createdAt))}
          </p>
        </div>
        {submission.status === "new" ? null : (
          <Badge variant="outline">
            {SUBMISSION_STATUS_LABELS[submission.status]}
            {submission.reviewer ? ` by ${submission.reviewer}` : ""}
          </Badge>
        )}
      </div>

      {payload ? (
        <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          {(
            [
              ["What happened", SUBMISSION_MOVE_LABELS[payload.move]],
              ["Sport", payload.sportSlug],
              ["Position", payload.position],
              ["Current school", payload.currentSchool],
              ["New school", payload.destinationSchool],
              ["Date", payload.happenedOn],
              ["Note", payload.note],
            ] as const
          )
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div key={label} className="flex gap-2">
                <dt className="text-muted-foreground shrink-0">{label}</dt>
                <dd className="min-w-0 break-words">{value}</dd>
              </div>
            ))}
          {payload.link ? (
            <div className="flex gap-2">
              <dt className="text-muted-foreground shrink-0">Link</dt>
              <dd className="min-w-0 truncate">
                {/* Their link, unchecked: open it without passing our address along. */}
                <a
                  href={payload.link}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="underline underline-offset-4"
                >
                  {payload.link}
                </a>
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <p className="text-muted-foreground text-xs">
        From {submission.submitterName ?? "someone"} ({role}) ·{" "}
        <a
          href={`mailto:${submission.submitterEmail}`}
          className="underline underline-offset-4"
        >
          {submission.submitterEmail}
        </a>
        {submission.matchedPlayerId ? (
          <>
            {" · "}
            <Link
              href={`/portal/players/${submission.matchedPlayerId}`}
              className="underline underline-offset-4"
            >
              Player #{submission.matchedPlayerId}
            </Link>
          </>
        ) : null}
      </p>

      {submission.status === "new" ? (
        <div className="flex flex-wrap gap-2">
          {payload ? (
            <Button
              size="sm"
              render={<Link href={`/portal/new?submission=${submission.id}`} />}
            >
              Add as a new player
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => close("accepted")}
          >
            Done (recorded on an existing player)
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => close("rejected")}
          >
            Reject
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => close("spam")}
          >
            Spam
          </Button>
        </div>
      ) : null}
    </li>
  );
}

/** Moves the public reported. Nothing here is on the site until an editor enters it. */
export function SubmissionInboxList({ inbox }: { inbox: SubmissionInbox }) {
  const last = inbox.submissions.at(-1);
  return (
    <div className="flex flex-col gap-4">
      <nav className="flex gap-3 text-sm" aria-label="Status">
        {PLAYER_SUBMISSION_STATUSES.map((status) => (
          <Link
            key={status}
            href={
              status === "new"
                ? "/portal/submissions"
                : `/portal/submissions?status=${status}`
            }
            aria-current={status === inbox.status ? "page" : undefined}
            className={
              status === inbox.status
                ? "font-medium"
                : "text-muted-foreground hover:underline"
            }
          >
            {SUBMISSION_STATUS_LABELS[status]}
          </Link>
        ))}
      </nav>
      {inbox.submissions.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border p-8 text-center text-sm">
          {inbox.status === "new"
            ? "Nothing waiting. New submissions show up here."
            : "None."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {inbox.submissions.map((submission) => (
            <SubmissionCard key={submission.id} submission={submission} />
          ))}
        </ul>
      )}
      {inbox.hasMore && last ? (
        <Link
          href={`/portal/submissions?status=${inbox.status}&before=${last.id}`}
          className="text-sm font-medium hover:underline"
        >
          Older submissions
        </Link>
      ) : null}
    </div>
  );
}
