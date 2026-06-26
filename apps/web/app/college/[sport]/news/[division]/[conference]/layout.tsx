import { draftAwareParamsPage } from "@/lib/draft-cache";
import { CollegeNewsConferenceLayout } from "@/components/college-news/college-news-conference-layout";

export default function ConferenceNewsLayout({
  params,
  children,
}: {
  params: Promise<{ sport: string; division: string; conference: string }>;
  children: React.ReactNode;
}) {
  return draftAwareParamsPage(
    params,
    null,
    async ({ sport, division, conference }, options) => (
      <CollegeNewsConferenceLayout
        sport={sport}
        division={division}
        conference={conference}
        {...options}
      >
        {children}
      </CollegeNewsConferenceLayout>
    ),
  );
}
