import { Button } from "@redshirt-sports/ui/components/button";

export default function VoteHomePage() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-16">
      <p className="kicker text-primary">Invite only</p>
      <h1 className="font-display text-4xl">Redshirt Sports Vote</h1>
      <p className="text-muted-foreground">
        Credentialed voters open a personal invite, then file a Top 25 ballot
        here. There is no public application and no fan vote.
      </p>
      <Button asChild>
        <a href="/sign-in">Sign in</a>
      </Button>
    </main>
  );
}
