export default function HistoryPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-6">
      <h1 className="text-3xl font-semibold tracking-tight">History</h1>
      <p className="text-muted-foreground">
        Past ballots for the signed-in voter will be listed here.
      </p>
    </main>
  );
}
