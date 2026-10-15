export default async function BallotPage({
  params,
}: {
  params: Promise<{ poll: string; year: string; week: string }>;
}) {
  const { poll, year, week } = await params;
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 px-6 py-16">
      <h1 className="font-display text-3xl">Ballot</h1>
      <p>
        {poll} · {year} · {week}
      </p>
      <p className="text-muted-foreground">
        The ballot editor arrives with the polls milestone. Signed-out visitors
        are sent to sign-in before this page renders.
      </p>
    </main>
  );
}
