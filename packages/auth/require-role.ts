import "server-only";

import { auth } from "@clerk/nextjs/server";

type SessionMetadata = {
  isAdmin?: boolean;
  isVoter?: boolean;
};

export async function requireUserId() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

export async function requireRole(role: "admin" | "voter") {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  const metadata = sessionClaims?.metadata as SessionMetadata | undefined;
  const allowed = role === "admin" ? metadata?.isAdmin : metadata?.isVoter;
  if (!allowed) {
    throw new Error("Forbidden");
  }
  return userId;
}
