import { Avatar, AvatarFallback } from "@redshirt-sports/ui/components/avatar";

export function TeamMark({
  name,
  abbreviation,
}: {
  name: string;
  abbreviation?: string;
}) {
  const fallback =
    abbreviation ??
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 3)
      .toUpperCase();

  return (
    <Avatar>
      <AvatarFallback aria-label={name}>{fallback}</AvatarFallback>
    </Avatar>
  );
}
