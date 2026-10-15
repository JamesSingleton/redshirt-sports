import {
  type ClerkMiddlewareOptions,
  clerkMiddleware,
} from "@clerk/nextjs/server";
import type { NextMiddleware, NextRequest } from "next/server";

import { resolveAuthorizedParties } from "./authorized-parties";

function withAuthorizedParties(
  options?: ClerkMiddlewareOptions,
): ClerkMiddlewareOptions {
  return {
    ...options,
    authorizedParties: options?.authorizedParties ?? resolveAuthorizedParties(),
  };
}

type AuthHandler = (
  auth: {
    (): Promise<{
      userId: string | null;
      sessionClaims?: {
        metadata?: Record<string, unknown>;
      } | null;
    }>;
    protect: () => Promise<unknown>;
  },
  request: NextRequest,
) => Promise<Response | undefined> | Response | undefined;

/**
 * Clerk middleware with the Redshirt authorized-party allowlist.
 * In Clerk 7 this option belongs on `clerkMiddleware`, not `ClerkProvider`.
 */
export function authMiddleware(
  handler?: AuthHandler,
  options?: ClerkMiddlewareOptions,
): NextMiddleware {
  const parties = withAuthorizedParties(options);
  if (handler) {
    return clerkMiddleware(async (auth, request) => {
      return handler(auth as Parameters<AuthHandler>[0], request);
    }, parties);
  }
  return clerkMiddleware(parties);
}
