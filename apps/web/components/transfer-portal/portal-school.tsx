import type { PortalSchool as PortalSchoolData } from "@redshirt-sports/db/queries";
import { cn } from "@redshirt-sports/ui/lib/utils";
import type { Route } from "next";
import Link from "next/link";

import CustomImage from "@/components/sanity-image";
import { schoolDisplayName } from "@/lib/transfer-portal-format";

type SchoolImage = Parameters<typeof CustomImage>[0]["image"];

export function PortalSchoolLogo({
  school,
  size = 28,
  className,
}: {
  school: PortalSchoolData;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {school.image ? (
        <CustomImage
          image={school.image as SchoolImage}
          width={size}
          height={size}
          mode="contain"
          className="size-full object-contain"
        />
      ) : null}
    </span>
  );
}

export function PortalSchool({
  school,
  fallback = "Undecided",
}: {
  school: PortalSchoolData | null;
  fallback?: string;
}) {
  if (!school) {
    return <span className="text-muted-foreground text-sm">{fallback}</span>;
  }

  const content = (
    <>
      <PortalSchoolLogo school={school} />
      <span className="truncate text-sm font-semibold">
        {schoolDisplayName(school)}
      </span>
    </>
  );

  return school.slug ? (
    <Link
      href={`/college/teams/${school.slug}` as Route}
      className="flex min-w-0 items-center gap-2 hover:underline"
    >
      {content}
    </Link>
  ) : (
    <span className="flex min-w-0 items-center gap-2">{content}</span>
  );
}
