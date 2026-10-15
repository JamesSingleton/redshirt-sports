export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 px-6 py-16">
      <h1 className="font-display text-3xl">Voter invite</h1>
      <p>
        This invite is for one credentialed voter. Accepting it is wired in the
        polls milestone. The token is not displayed in full.
      </p>
      <p className="text-sm text-muted-foreground">
        Reference {token.slice(0, 4)}…
      </p>
      <a className="text-primary underline" href="/sign-in">
        Sign in to continue
      </a>
    </main>
  );
}
