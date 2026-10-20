import { cn } from "@redshirt-sports/ui/lib/utils";

export function BallotDiffChip({
  diff,
}: {
  diff: number | "rv" | "equal";
}) {
  if (diff === "rv") {
    return (
      <span
        className="inline-flex min-w-9 justify-center rounded px-1 text-[10px] font-bold text-new bg-new/10"
      >
        RV
      </span>
    );
  }
  if (diff === "equal") {
    return (
      <span
        className="inline-flex min-w-9 justify-center rounded px-1 text-[10px] font-semibold text-muted-foreground"
      >
        =
      </span>
    );
  }
  const isUp = diff > 0;
  return (
    <span
      className={cn(
        "inline-flex min-w-9 justify-center rounded px-1 text-[10px] font-bold tabular",
        isUp ? "text-up bg-up/10" : "text-down bg-down/10",
      )}
      aria-label={`${Math.abs(diff)} spots ${isUp ? "above" : "below"} consensus`}
    >
      {isUp ? "+" : "−"}
      {Math.abs(diff)}
    </span>
  );
}
