import { type Mock, vi } from "vitest";

export type AuthMocks = {
  auth: Mock & { protect: Mock };
  protect: Mock;
};

/** Factory for auth mocks — call inside `vi.hoisted(() => createAuthMocks())`. */
export function createAuthMocks(): AuthMocks {
  const protect = vi.fn();
  const auth = Object.assign(vi.fn(), { protect });
  return { auth, protect };
}
