import { urls } from "@redshirt-sports/seo/urls";
import { Button } from "@redshirt-sports/ui/components/button";
import type { Metadata } from "next";
import Link from "next/link";

import PageHeader from "@/components/page-header";

export const metadata: Metadata = {
  title: "College",
  description:
    "College football, men's basketball, and women's basketball news and rankings.",
};

const sports = [
  { href: urls.news("cfb"), label: "College Football" },
  { href: urls.news("mbb"), label: "Men's Basketball" },
  { href: urls.news("wbb"), label: "Women's Basketball" },
] as const;

export default function CollegeHubPage() {
  return (
    <main className="container mx-auto flex flex-col gap-8 px-4 py-8">
      <PageHeader
        title="College"
        subtitle="News and rankings across college football and basketball."
      />
      <div className="flex flex-wrap gap-3">
        {sports.map((sport) => (
          <Button key={sport.href} asChild>
            <Link href={sport.href}>{sport.label}</Link>
          </Button>
        ))}
        <Button variant="outline" asChild>
          <Link href={urls.levelNews("college")}>All college news</Link>
        </Button>
      </div>
    </main>
  );
}
