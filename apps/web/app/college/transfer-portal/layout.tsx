import Link from "next/link";

export default function TransferPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="border-b border-border bg-muted/30">
        <div className="container max-w-6xl px-4 py-2 text-xs text-muted-foreground">
          <Link href="/college/transfer-portal" className="hover:text-foreground">
            Transfer Portal
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}
