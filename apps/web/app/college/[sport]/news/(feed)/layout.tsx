import { draftAwareParamsPage } from "@/lib/draft-cache";
import { CollegeNewsSportLayout } from "@/components/college-news/college-news-sport-layout";

export default function SportNewsLayout({
  params,
  children,
}: {
  params: Promise<{ sport: string }>;
  children: React.ReactNode;
}) {
  return draftAwareParamsPage(params, null, async ({ sport }, options) => (
    <CollegeNewsSportLayout sport={sport} {...options}>
      {children}
    </CollegeNewsSportLayout>
  ));
}
