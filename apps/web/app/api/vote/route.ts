import { auth } from "@clerk/nextjs/server";

/**
 * @deprecated Use POST /api/vote/college/[sport]/rankings/[division]
 */
export async function POST() {
  const user = await auth();
  if (!user.userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  return new Response(
    JSON.stringify({
      error:
        "This vote endpoint is retired. Submit ballots via /api/vote/college/{sport}/rankings/{division}.",
    }),
    {
      status: 410,
      headers: { "Content-Type": "application/json" },
    },
  );
}
