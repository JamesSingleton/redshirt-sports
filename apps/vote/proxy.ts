import { AUTHORIZED_PARTIES } from "@redshirt-sports/auth/authorized-parties";
import { authMiddleware } from "@redshirt-sports/auth/proxy";
import type { NextRequest } from "next/server";

function isVoterRoute(req: NextRequest) {
  const { pathname } = req.nextUrl;
  return (
    pathname.startsWith("/ballot") ||
    pathname.startsWith("/history") ||
    pathname.startsWith("/profile")
  );
}

export default authMiddleware(
  async (auth, req) => {
    if (isVoterRoute(req)) {
      await auth.protect();
    }
  },
  { authorizedParties: [...AUTHORIZED_PARTIES] },
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
