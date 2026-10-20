import Link from "next/link";

type SocialLinks = {
  facebook?: string | null;
  twitter?: string | null;
  youtube?: string | null;
  instagram?: string | null;
  bluesky?: string | null;
  threads?: string | null;
};

function labelFromUrl(url: string, network: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (network === "twitter") {
      const handle = url.split("/").filter(Boolean).pop();
      return `@${handle}`;
    }
    return host;
  } catch {
    return url;
  }
}

const NETWORKS: Array<{
  key: keyof SocialLinks;
  label: string;
}> = [
  { key: "twitter", label: "X" },
  { key: "bluesky", label: "Bluesky" },
  { key: "instagram", label: "Instagram" },
  { key: "threads", label: "Threads" },
  { key: "facebook", label: "Facebook" },
  { key: "youtube", label: "YouTube" },
];

export function SiteSocialButtons({
  socialLinks,
  className,
}: {
  socialLinks: SocialLinks;
  className?: string;
}) {
  const items = NETWORKS.flatMap(({ key, label }) => {
    const url = socialLinks[key];
    if (!url) return [];
    return [{ url, label, hint: labelFromUrl(url, key) }];
  });

  if (items.length === 0) return null;

  return (
    <ul className={`flex flex-wrap gap-2 ${className ?? ""}`}>
      {items.map((item) => (
        <li key={item.url}>
          <Link
            href={item.url}
            rel="me noopener noreferrer"
            target="_blank"
            className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
          >
            {item.label}
            <span className="text-xs text-muted-foreground">{item.hint}</span>
            <span className="sr-only"> (opens {item.label})</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
