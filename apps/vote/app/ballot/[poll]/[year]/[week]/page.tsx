export default async function BallotPage({
  params,
}: {
  params: Promise<{ poll: string; year: string; week: string }>;
}) {
  const { poll, year, week } = await params;

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Ballot</h1>
      <p className="text-muted-foreground">
        {poll} · {year} · {week}
      </p>
      <p className="text-muted-foreground">
        The ballot editor moves here from www. Until then, voters still submit
        on the main site.
      </p>
    </main>
  );
}
