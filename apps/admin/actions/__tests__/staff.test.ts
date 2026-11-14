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

import { findPeople, getStaff, setStaffRoles } from "@/actions/staff";

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

  it("lists staff with their roles, counting the old admin flag", async () => {
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
          roles: ["portal"],
        },
        expect.objectContaining({ id: "user_me", roles: ["admin"] }),
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

  it("writes roles to Clerk and Postgres, in order, without junk", async () => {
    const saved = await setStaffRoles({
      userId: "user_zach",
      roles: ["ballots", "superuser", "portal"],
    });
    expect(saved).toEqual(["portal", "ballots"]);
    expect(mockUpdateMetadata).toHaveBeenCalledWith("user_zach", {
      publicMetadata: { roles: ["portal", "ballots"], isAdmin: false },
    });
    expect(mockSetRoles).toHaveBeenCalledWith({
      id: "user_zach",
      roles: ["portal", "ballots"],
      isAdmin: false,
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/staff");
  });

  it("keeps the admin flag in step with the admin role", async () => {
    await setStaffRoles({ userId: "user_zach", roles: ["admin"] });
    expect(mockUpdateMetadata).toHaveBeenCalledWith("user_zach", {
      publicMetadata: { roles: ["admin"], isAdmin: true },
    });
  });

  it("won't let an admin remove their own admin role", async () => {
    await expect(
      setStaffRoles({ userId: "user_me", roles: ["portal"] }),
    ).rejects.toThrow("You can't remove your own admin role.");
    await expect(setStaffRoles({ userId: "", roles: [] })).rejects.toThrow(
      "userId is required",
    );
    expect(mockUpdateMetadata).not.toHaveBeenCalled();
  });
});
