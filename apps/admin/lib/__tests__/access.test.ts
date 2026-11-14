const { mockProtect, mockNotFound, mockRedirect } = vi.hoisted(() => ({
  mockProtect: vi.fn(),
  mockNotFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  mockRedirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT ${url}`);
  }),
}));

vi.mock("@redshirt-sports/auth/server", () => ({
  auth: { protect: mockProtect },
}));
vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
  redirect: mockRedirect,
}));
// `cache` dedupes per request in React; here every call should re-read.
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  cache: <T>(fn: T) => fn,
}));

import { STAFF_ROLE_INFO, staffRoles } from "@redshirt-sports/auth/roles";

import { areasFor, requireArea, requireStaff } from "@/lib/access";

const signedIn = (metadata: unknown) =>
  mockProtect.mockResolvedValue({
    userId: "user_1",
    sessionClaims: { metadata },
  });

describe("staff roles", () => {
  it("reads roles from metadata, dropping anything unknown", () => {
    expect(staffRoles({ roles: ["ballots", "portal"] })).toEqual([
      "portal",
      "ballots",
    ]);
    expect(staffRoles({ roles: ["portal", "superuser", 7] })).toEqual([
      "portal",
    ]);
    // The old flag still means admin, once.
    expect(staffRoles({ isAdmin: true, roles: ["admin"] })).toEqual(["admin"]);
    expect(staffRoles({ isAdmin: "true" })).toEqual([]);
    expect(staffRoles({ roles: "admin" })).toEqual([]);
    expect(staffRoles(null)).toEqual([]);
    expect(staffRoles(undefined)).toEqual([]);
  });

  it("describes every role", () => {
    expect(Object.keys(STAFF_ROLE_INFO)).toEqual([
      "admin",
      "portal",
      "ballots",
    ]);
  });

  it("gives admins every area and others only theirs", () => {
    expect([...areasFor(["admin"])]).toEqual(["admin", "portal", "ballots"]);
    expect([...areasFor(["portal", "ballots"])]).toEqual(["portal", "ballots"]);
    expect(areasFor([]).size).toBe(0);
  });
});

describe("access checks", () => {
  afterEach(() => vi.clearAllMocks());

  it("lets staff into their areas and 404s the rest", async () => {
    signedIn({ roles: ["portal"] });
    await expect(requireArea("portal")).resolves.toMatchObject({
      userId: "user_1",
      roles: ["portal"],
    });
    await expect(requireArea("admin")).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(requireArea("ballots")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("lets admins in everywhere, including by the old flag", async () => {
    signedIn({ isAdmin: true });
    for (const area of ["admin", "portal", "ballots"] as const) {
      await expect(requireArea(area)).resolves.toMatchObject({
        roles: ["admin"],
      });
    }
  });

  it("sends signed-in people with no role to the public site", async () => {
    signedIn({ isVoter: true });
    await expect(requireStaff()).rejects.toThrow(
      "REDIRECT https://www.redshirtsports.com",
    );
    mockProtect.mockResolvedValue({ userId: "user_2", sessionClaims: null });
    await expect(requireArea("portal")).rejects.toThrow("REDIRECT");
  });
});
