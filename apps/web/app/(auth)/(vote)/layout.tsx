import { requireVoter } from "@/lib/require-voter";

/**
 * Vote route group — resource-level auth (isVoter) instead of Middleware matchers.
 */
export default async function VoteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireVoter();
  return children;
}
