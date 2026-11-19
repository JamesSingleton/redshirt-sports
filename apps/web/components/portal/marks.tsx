import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@redshirt-sports/ui/components/tooltip";
import { cn } from "@redshirt-sports/ui/lib/utils";
import { GraduationCap } from "lucide-react";

import {
  WIRE_STATUS_CLASSES,
  WIRE_STATUS_LABELS,
  type WireSchoolView,
} from "@/components/portal/wire-format";
import { TeamMark } from "@/components/rankings/team-mark";

// Marks the wire and player pages share: school tiles, the grad-transfer cap,
// the path arrow, and the class chip.

export function SchoolTile({
  view,
  faded = false,
  caption,
}: {
  view: WireSchoolView | null;
  faded?: boolean;
  caption?: string | null;
}) {
  return (
    <span className="relative flex shrink-0">
      {view ? (
        <span
          // Logos are drawn for white. A dark tile hides dark marks (Montana's
          // maroon), so tiles stay white in dark mode too.
          className={cn(
            "flex size-10 items-center justify-center rounded-md border bg-white dark:border-white/20",
            !faded && "shadow-xs",
          )}
          title={view.name}
        >
          <span
            className={cn(
              "flex items-center justify-center",
              faded && "opacity-45 grayscale-[60%]",
            )}
          >
            <TeamMark
              image={view.school?.image ?? null}
              shortName={view.school?.shortName ?? view.name}
              abbreviation={view.school?.abbreviation}
              name={view.school?.name ?? view.name}
              size="sm"
            />
          </span>
        </span>
      ) : (
        <span
          className="border-muted-foreground/40 bg-muted/50 text-muted-foreground font-display flex size-10 items-center justify-center rounded-md border-2 border-dashed text-lg font-bold"
          title="Undecided"
        >
          ?
        </span>
      )}
      {caption ? (
        <span className="text-muted-foreground absolute top-full left-1/2 mt-1 -translate-x-1/2 text-[10px] font-semibold tracking-wide whitespace-nowrap uppercase">
          {caption}
        </span>
      ) : null}
    </span>
  );
}

export const GRAD_TRANSFER_TIP =
  "Grad transfer: earned a degree before transferring";

/** After a grad transfer's name: the cap, explained on hover and focus. */
export function GradCap({
  iconClassName = "size-4",
}: {
  iconClassName?: string;
} = {}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            // Focusable so keyboard users get the tooltip too.
            // biome-ignore lint/a11y/noNoninteractiveTabindex: it opens a tooltip
            tabIndex={0}
            role="img"
            aria-label={GRAD_TRANSFER_TIP}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex shrink-0 cursor-help rounded-sm outline-none focus-visible:ring-2"
          />
        }
      >
        <GraduationCap className={iconClassName} aria-hidden />
      </TooltipTrigger>
      <TooltipContent>{GRAD_TRANSFER_TIP}</TooltipContent>
    </Tooltip>
  );
}

export function PathArrow() {
  return (
    <svg
      viewBox="0 0 8 10"
      className="fill-foreground h-2.5 w-2 shrink-0"
      aria-hidden
    >
      <path d="M0 0 8 5 0 10z" />
    </svg>
  );
}

export function ClassChip({ code }: { code: string }) {
  return (
    <span className="rounded border px-1 text-[10px] font-semibold">
      {code}
    </span>
  );
}

/** A round logo, as the player profile draws schools. Null draws a dashed "?". */
export function SchoolMark({
  view,
  faded = false,
  ring = false,
  className,
}: {
  view: WireSchoolView | null;
  faded?: boolean;
  /** The school they're headed to. */
  ring?: boolean;
  className?: string;
}) {
  if (!view) {
    return (
      <span
        className={cn(
          "border-muted-foreground/40 text-muted-foreground bg-card flex size-9 shrink-0 items-center justify-center rounded-full border border-dashed text-sm font-bold",
          className,
        )}
        title="Undecided"
      >
        ?
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-white dark:border-white/20",
        ring && "ring-primary ring-offset-card ring-2 ring-offset-2",
        className,
      )}
      title={view.name}
    >
      <span className={cn("flex", faded && "opacity-45 grayscale-[60%]")}>
        {view.school?.image ? (
          <TeamMark
            image={view.school.image}
            shortName={view.school.shortName ?? view.name}
            abbreviation={view.school.abbreviation}
            name={view.school.name ?? view.name}
            size="xs"
          />
        ) : (
          // No logo: initials, dark on the white tile in both themes.
          <span
            className="font-display text-[10px] font-bold tracking-wide text-neutral-600"
            aria-hidden
          >
            {(view.school?.abbreviation ?? view.name).slice(0, 4).toUpperCase()}
          </span>
        )}
      </span>
    </span>
  );
}

/** Entered, Committed, Signed, Enrolled, Withdrawn: the tracker's pills. */
export function StatusPill({
  status,
  className,
}: {
  status: keyof typeof WIRE_STATUS_LABELS;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-full border px-2.5 text-xs font-semibold",
        WIRE_STATUS_CLASSES[status],
        className,
      )}
    >
      {WIRE_STATUS_LABELS[status]}
    </span>
  );
}
