import { type Mock, vi } from "vitest";

export type NextNavigationMocks = {
  useRouter: Mock;
  usePathname: Mock;
  useSearchParams: Mock;
  useParams: Mock;
  notFound: Mock;
  redirect: Mock;
  permanentRedirect: Mock;
  router: {
    push: Mock;
    replace: Mock;
    refresh: Mock;
    back: Mock;
    forward: Mock;
    prefetch: Mock;
  };
};

/** Factory for next/navigation mocks — call inside `vi.hoisted(() => createNextNavigationMocks())`. */
export function createNextNavigationMocks(
  options: {
    pathname?: string;
    searchParams?: Record<string, string>;
    params?: Record<string, string>;
  } = {},
): NextNavigationMocks {
  const router = {
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  };

  const searchParams = new URLSearchParams(options.searchParams ?? {});

  return {
    useRouter: vi.fn(() => router),
    usePathname: vi.fn(() => options.pathname ?? "/"),
    useSearchParams: vi.fn(() => searchParams),
    useParams: vi.fn(() => options.params ?? {}),
    notFound: vi.fn(() => {
      throw new Error("NEXT_NOT_FOUND");
    }),
    redirect: vi.fn((url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    }),
    permanentRedirect: vi.fn((url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    }),
    router,
  };
}

/** Apply navigation mocks to `next/navigation`. Call after `vi.hoisted`. */
export function applyNextNavigationMock(mocks: NextNavigationMocks) {
  vi.mock("next/navigation", () => ({
    useRouter: mocks.useRouter,
    usePathname: mocks.usePathname,
    useSearchParams: mocks.useSearchParams,
    useParams: mocks.useParams,
    notFound: mocks.notFound,
    redirect: mocks.redirect,
    permanentRedirect: mocks.permanentRedirect,
  }));
}
