import { permanentRedirect } from "next/navigation";

import { personHref } from "@/lib/person-href";
import { validatePageIndex } from "@/utils/validate-page-index";

export { generateMetadata } from "@/app/people/[slug]/page";

export default async function AuthorLegacyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ slug }, { page }] = await Promise.all([params, searchParams]);
  const pageIndex = validatePageIndex(page);
  const suffix = pageIndex > 1 ? `?page=${pageIndex}` : "";
  permanentRedirect(`${personHref(slug)}${suffix}`);
}
