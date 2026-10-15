import { voteOrigin } from "@redshirt-sports/seo/urls";
import { Button } from "@redshirt-sports/ui/components/button";

export default function StaffOnlyPage() {
  const voteUrl = voteOrigin();
  let voteHost = voteUrl;
  try {
    voteHost = new URL(voteUrl).host;
  } catch {
    voteHost = voteUrl;
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-6">
      <p className="font-medium text-muted-foreground text-sm">403</p>
      <h1 className="font-semibold text-3xl tracking-tight">Staff only</h1>
      <p className="text-muted-foreground">
        This dashboard is for Redshirt Sports staff. Voters cast ballots on the
        vote site.
      </p>
      <Button asChild>
        <a href={voteUrl}>Go to {voteHost}</a>
      </Button>
    </main>
  );
}
