import { requireArea } from "@/lib/access";

/**
 * Everything here is admin-only: rankings, voting panels, polls, ratings,
 * school IDs, brackets, and development. The route group keeps URLs as they
 * were; this layout keeps everyone else out (a 404). Each Server Action
 * checks again.
 */
export default async function AdminOnlyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireArea("admin");
  return children;
}
