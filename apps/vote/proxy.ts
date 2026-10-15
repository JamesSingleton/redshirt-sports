import { authMiddleware } from "@redshirt-sports/auth/proxy";
import { type NextRequest, NextResponse } from "next/server";

type VoteAuth = {
  (): Promise<{ userId: string | null }>;
  protect: (options?: { unauthenticatedUrl?: string }) => Promise<unknown>;
};

function isBallotRoute(req: NextRequest) {
  const { pathname } = req.nextUrl;
  return pathname === "/ballot" || pathname.startsWith("/ballot/");
}

/** Signed-out ballot routes go to sign-in. `/invite` stays public. */
export async function handleVoteProxy(auth: VoteAuth, req: NextRequest) {
  if (!isBallotRoute(req)) {
    return NextResponse.next();
  }

  const { userId } = await auth();
  if (userId) {
    return NextResponse.next();
  }

  const signIn = new URL("/sign-in", req.url);
  signIn.searchParams.set("redirect_url", req.url);
  return NextResponse.redirect(signIn);
}

export default authMiddleware(handleVoteProxy);

export const config = {
  matcher: ["/ballot/:path*", "/invite/:path*"],
};
