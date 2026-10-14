import { Button } from "@redshirt-sports/ui/components/button";

const VOTE_URL = "https://vote.redshirtsports.com";

export default function StaffOnlyPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-6">
      <p className="text-muted-foreground text-sm font-medium">403</p>
      <h1 className="text-3xl font-semibold tracking-tight">Staff only</h1>
      <p className="text-muted-foreground">
        This dashboard is for Redshirt Sports staff. Voters cast ballots on the
        vote site.
      </p>
      <Button asChild>
        <a href={VOTE_URL}>Go to vote.redshirtsports.com</a>
      </Button>
    </main>
  );
}
