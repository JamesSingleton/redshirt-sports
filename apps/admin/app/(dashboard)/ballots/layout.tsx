import { requireArea } from "@/lib/access";

/** Read-only ballots: admins and ballot viewers. Everyone else gets a 404. */
export default async function BallotsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireArea("ballots");
  return children;
}
