import { Top25Widget } from "@/components/home/top25-widget";
import type { CollegeNewsPollWidgetData } from "@/lib/college-news-rankings";

interface CollegeNewsPollWidgetProps {
  data: CollegeNewsPollWidgetData | null | undefined;
}

export function CollegeNewsPollWidget({ data }: CollegeNewsPollWidgetProps) {
  if (!data) {
    return null;
  }

  const hasPoll = Object.values(data.polls).some((poll) => poll != null);
  if (!hasPoll) {
    return null;
  }

  return (
    <Top25Widget
      sportSlug={data.sportSlug}
      polls={data.polls}
      pinnedDivision={data.pinnedDivision}
      tabOrder={data.tabOrder}
    />
  );
}
