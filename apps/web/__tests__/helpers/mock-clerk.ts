import type { ReactNode } from "react";
import { type Mock, vi } from "vitest";

import { type AuthMocks, createAuthMocks } from "./mock-auth";

export type ClerkMocks = AuthMocks & {
  useUser: Mock;
  useAuth: Mock;
  useClerk: Mock;
  SignedIn: Mock;
  SignedOut: Mock;
  SignIn: Mock;
  SignUp: Mock;
  UserButton: Mock;
  clerkClient: Mock;
  currentUser: Mock;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    fullName: string | null;
    primaryEmailAddress: { emailAddress: string } | null;
    publicMetadata: Record<string, unknown>;
  } | null;
};

/** Factory for Clerk client/server mocks — call inside `vi.hoisted`. */
export function createClerkMocks(
  options: {
    userId?: string | null;
    signedIn?: boolean;
    onboardingComplete?: boolean;
  } = {},
): ClerkMocks {
  const signedIn = options.signedIn ?? Boolean(options.userId);
  const userId = options.userId ?? (signedIn ? "user_test_123" : null);
  const authMocks = createAuthMocks();

  const user = userId
    ? {
        id: userId,
        firstName: "Test",
        lastName: "User",
        fullName: "Test User",
        primaryEmailAddress: { emailAddress: "test@example.com" },
        publicMetadata: {
          onboardingComplete: options.onboardingComplete ?? true,
        },
      }
    : null;

  authMocks.auth.mockResolvedValue({
    userId,
    sessionClaims: userId
      ? {
          metadata: {
            onboardingComplete: options.onboardingComplete ?? true,
          },
        }
      : null,
  });

  return {
    ...authMocks,
    useUser: vi.fn(() => ({
      isLoaded: true,
      isSignedIn: signedIn,
      user,
    })),
    useAuth: vi.fn(() => ({
      isLoaded: true,
      isSignedIn: signedIn,
      userId,
    })),
    useClerk: vi.fn(() => ({
      signOut: vi.fn(),
      openSignIn: vi.fn(),
      openSignUp: vi.fn(),
    })),
    SignedIn: vi.fn(({ children }: { children: ReactNode }) =>
      signedIn ? children : null,
    ),
    SignedOut: vi.fn(({ children }: { children: ReactNode }) =>
      signedIn ? null : children,
    ),
    SignIn: vi.fn(() => null),
    SignUp: vi.fn(() => null),
    UserButton: vi.fn(() => null),
    clerkClient: vi.fn(async () => ({
      users: {
        updateUser: vi.fn(),
        updateUserMetadata: vi.fn(),
        getUser: vi.fn(),
      },
    })),
    currentUser: vi.fn(async () => user),
    user,
  };
}
