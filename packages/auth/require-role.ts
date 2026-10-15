import "server-only";

import { auth } from "@clerk/nextjs/server";

import { type AppRole, hasRole, type RoleMetadata } from "./roles";

export async function requireUserId() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

export async function requireRole(role: AppRole) {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  const metadata = sessionClaims?.metadata as RoleMetadata | undefined;
  if (!hasRole(metadata, role)) {
    throw new Error("Forbidden");
  }
  return userId;
}
