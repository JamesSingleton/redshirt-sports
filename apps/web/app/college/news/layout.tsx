import { CollegeNewsBreadcrumbs } from "@/components/college-news/college-news-breadcrumbs";
import { CollegeNewsPageShell } from "@/components/college-news/college-news-page-shell";
import { CollegeNewsSidebar } from "@/components/college-news/college-news-sidebar";
import { COLLEGE_NEWS_DESCRIPTION } from "@/lib/college-news-config";

export default function CollegeNewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CollegeNewsPageShell
      header={
        <CollegeNewsBreadcrumbs items={[{ label: "College Sports News" }]} />
      }
      main={
        <>
          <header className="mb-6">
            <h1 className="text-2xl font-black text-foreground leading-tight md:text-3xl">
              College Sports News
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {COLLEGE_NEWS_DESCRIPTION}
            </p>
          </header>
          {children}
        </>
      }
      sidebar={<CollegeNewsSidebar />}
    />
  );
}
