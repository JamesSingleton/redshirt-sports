export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Invite</h1>
      <p className="text-muted-foreground">
        This invite link is ready. Accepting it will be wired to the voter
        roster next. The token is not shown in full.
      </p>
      <p className="text-muted-foreground text-sm">
        Token length: {token.length}
      </p>
    </main>
  );
}
