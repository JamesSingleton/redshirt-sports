import { Avatar, AvatarFallback } from "@redshirt-sports/ui/components/avatar";
import { cn } from "@redshirt-sports/ui/lib/utils";

import CustomImage from "@/components/sanity-image";
import { getInitials } from "@/lib/initials";

const SIZE_PX = { sm: 20, md: 24, lg: 40 } as const;
const SIZE_CLASS = {
  sm: "size-5",
  md: "size-6",
  lg: "size-10",
} as const;

export function AuthorAvatar({
  name,
  image,
  size = "md",
  className,
}: {
  name?: string | null;
  image?: unknown;
  size?: keyof typeof SIZE_PX;
  className?: string;
}) {
  const px = SIZE_PX[size];

  return (
    <Avatar className={cn(SIZE_CLASS[size], className)}>
      <AvatarFallback className="text-[0.7em] font-semibold">
        {getInitials(name)}
      </AvatarFallback>
      {image ? (
        <CustomImage
          image={image as Parameters<typeof CustomImage>[0]["image"]}
          alt={name ?? ""}
          width={px * 2}
          height={px * 2}
          className="absolute inset-0 size-full rounded-full object-cover"
          mode="cover"
        />
      ) : null}
    </Avatar>
  );
}
