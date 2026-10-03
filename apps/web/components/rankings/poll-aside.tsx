import {
  DivisionTop25Card,
  DivisionTop25CardSkeleton,
  isPollDivision,
  Top25Card,
  Top25CardSkeleton,
} from "@/components/rankings/top25-card";
import { SuspenseReveal } from "@/components/suspense-reveal";

/**
 * Poll widget for a listing sidebar. Football only: the sport page gets the
 * tabbed card, a division page gets that division's poll, everything else none.
 */
export function PollAside({
  sport,
  division,
}: {
  sport: string;
  division?: string;
}) {
  if (sport !== "football") return null;
  if (division && !isPollDivision(division)) return null;

  if (division && isPollDivision(division)) {
    return (
      <SuspenseReveal fallback={<DivisionTop25CardSkeleton />}>
        <DivisionTop25Card division={division} />
      </SuspenseReveal>
    );
  }

  return (
    <SuspenseReveal fallback={<Top25CardSkeleton />}>
      <Top25Card />
    </SuspenseReveal>
  );
}
