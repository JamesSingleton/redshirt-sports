import { CollegeNewsDivisionLayout } from "@/components/college-news/college-news-division-layout";
import { draftAwareParamsPage } from "@/lib/draft-cache";

export default function DivisionNewsLayout({
  params,
  children,
}: {
  params: Promise<{ sport: string; division: string }>;
  children: React.ReactNode;
}) {
  return draftAwareParamsPage(
    params,
    null,
    async ({ sport, division }, options) => (
      <CollegeNewsDivisionLayout
        sport={sport}
        division={division}
        {...options}
      >
        {children}
      </CollegeNewsDivisionLayout>
    ),
  );
}
