import { requireArea } from "@/lib/access";

/** The transfer portal desk: admins and portal staff. Everyone else gets a 404. */
export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireArea("portal");
  return children;
}
