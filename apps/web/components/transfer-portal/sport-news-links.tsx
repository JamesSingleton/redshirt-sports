import Link from "next/link";

interface SportLink {
  slug: string;
  title: string;
}

export function TransferPortalSportNewsLinks({
  sports,
}: {
  sports: SportLink[];
}) {
  if (sports.length === 0) {
    return null;
  }

  return (
    <nav className="flex flex-wrap gap-2">
      {sports.map((sport) => (
        <Link
          key={sport.slug}
          href={`/college/${sport.slug}/transfer-portal/news`}
          className="rounded-full border border-border px-3 py-1 text-sm font-medium hover:bg-muted"
        >
          {sport.title} News
        </Link>
      ))}
    </nav>
  );
}
