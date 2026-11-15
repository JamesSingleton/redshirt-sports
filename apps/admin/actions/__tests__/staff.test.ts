import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRequireArea,
  mockUpdateMetadata,
  mockListStaff,
  mockSearch,
  mockSetRoles,
  mockRevalidatePath,
} = vi.hoisted(() => ({
  mockRequireArea: vi.fn(),
  mockUpdateMetadata: vi.fn(),
  mockListStaff: vi.fn(),
  mockSearch: vi.fn(),
  mockSetRoles: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

vi.mock("@/lib/access", () => ({ requireArea: mockRequireArea }));
vi.mock("@redshirt-sports/auth/server", () => ({
  clerkClient: async () => ({
    users: { updateUserMetadata: mockUpdateMetadata },
  }),
}));
vi.mock("@redshirt-sports/db/queries", () => ({
  listStaffUsers: mockListStaff,
  searchUsersByName: mockSearch,
  setUserRoles: mockSetRoles,
}));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

import { findPeople, getStaff, setStaffAccess } from "@/actions/staff";

const row = (overrides: Record<string, unknown> = {}) => ({
  id: "user_zach",
  firstName: "Zach",
  lastName: "McKinnell",
  organization: "Sports Illustrated",
  isAdmin: false,
  isVoter: true,
  roles: ["portal"],
  ...overrides,
});

describe("staff actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireArea.mockResolvedValue({ userId: "user_me" });
  });

  it("lists admins and staff with their roles", async () => {
    mockListStaff.mockResolvedValue([
      row(),
      row({ id: "user_me", firstName: "Me", roles: [], isAdmin: true }),
    ]);
    const result = await getStaff();
    expect(mockRequireArea).toHaveBeenCalledWith("admin");
    expect(result).toEqual({
      me: "user_me",
      staff: [
        {
          id: "user_zach",
          name: "Zach McKinnell",
          organization: "Sports Illustrated",
          isVoter: true,
          isAdmin: false,
          roles: ["portal"],
        },
        expect.objectContaining({ id: "user_me", isAdmin: true, roles: [] }),
      ],
    });
  });

  it("searches by name once there are two letters", async () => {
    expect(await findPeople(" z ")).toEqual([]);
    expect(mockSearch).not.toHaveBeenCalled();
    mockSearch.mockResolvedValue([row({ roles: [] })]);
    expect(await findPeople("zac")).toEqual([
      expect.objectContaining({ name: "Zach McKinnell", roles: [] }),
    ]);
    expect(mockRequireArea).toHaveBeenCalledWith("admin");
  });

  it("writes the admin flag and roles to Clerk and Postgres, without junk", async () => {
    const saved = await setStaffAccess({
      userId: "user_zach",
      isAdmin: false,
      roles: ["ballots", "admin", "superuser", "portal"],
    });
    expect(saved).toEqual({ isAdmin: false, roles: ["portal", "ballots"] });
    // isVoter isn't touched: Clerk merges the keys it's given.
    expect(mockUpdateMetadata).toHaveBeenCalledWith("user_zach", {
      publicMetadata: { isAdmin: false, roles: ["portal", "ballots"] },
    });
    expect(mockSetRoles).toHaveBeenCalledWith({
      id: "user_zach",
      roles: ["portal", "ballots"],
      isAdmin: false,
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/staff");
  });

  it("makes someone an admin with isAdmin", async () => {
    await setStaffAccess({ userId: "user_zach", isAdmin: true, roles: [] });
    expect(mockUpdateMetadata).toHaveBeenCalledWith("user_zach", {
      publicMetadata: { isAdmin: true, roles: [] },
    });
  });

  it("won't let an admin remove their own admin access", async () => {
    await expect(
      setStaffAccess({ userId: "user_me", isAdmin: false, roles: ["portal"] }),
    ).rejects.toThrow("You can't remove your own admin access.");
    await expect(
      setStaffAccess({ userId: "", isAdmin: false, roles: [] }),
    ).rejects.toThrow("userId is required");
    expect(mockUpdateMetadata).not.toHaveBeenCalled();
  });
});
