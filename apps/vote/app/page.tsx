import { urls } from "@redshirt-sports/seo/urls";
import { Button } from "@redshirt-sports/ui/components/button";
import Link from "next/link";

export default function VoterHomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 px-6">
      <p className="text-muted-foreground text-sm font-medium">
        vote.redshirtsports.com
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">Voting</h1>
      <p className="text-muted-foreground">
        Credentialed voters submit ballots here. This app does not publish news
        or rankings.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/sign-in">Sign in</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={new URL(urls.voteBallot("fcs", 2026, 7)).pathname}>
            FCS week 7 ballot
          </Link>
        </Button>
      </div>
    </main>
  );
}
