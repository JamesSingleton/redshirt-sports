import { cn } from "@redshirt-sports/ui/lib/utils";

export type DivisionSlug =
  | "fbs"
  | "fcs"
  | "d2"
  | "d3"
  | "naia"
  | "power-conference"
  | "mid-major"
  | "basketball";

interface DivisionBadgeProps {
  division: DivisionSlug | string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const divisionConfig: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  fbs: { label: "FBS", bg: "bg-primary", text: "text-white" },
  fcs: { label: "FCS", bg: "bg-[#1E1E24]", text: "text-white" },
  d2: { label: "D2", bg: "bg-[#40424D]", text: "text-white" },
  d3: { label: "D3", bg: "bg-[#EDEFF7]", text: "text-[#1E1E24]" },
  naia: { label: "NAIA", bg: "bg-[#6E7180]", text: "text-white" },
  "power-conference": { label: "POWER", bg: "bg-primary", text: "text-white" },
  "mid-major": { label: "MID-MAJOR", bg: "bg-[#40424D]", text: "text-white" },
  basketball: { label: "HOOPS", bg: "bg-[#1E1E24]", text: "text-white" },
};

export function DivisionBadge({
  division,
  className,
  size = "sm",
}: DivisionBadgeProps) {
  const config = divisionConfig[division] ?? {
    label: division.toUpperCase(),
    bg: "bg-muted",
    text: "text-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-extrabold uppercase tracking-widest",
        config.bg,
        config.text,
        size === "sm" && "px-2 py-0.5 text-[10px]",
        size === "md" && "px-3 py-1 text-xs",
        size === "lg" && "px-4 py-1.5 text-sm",
        className
      )}
    >
      {config.label}
    </span>
  );
}
