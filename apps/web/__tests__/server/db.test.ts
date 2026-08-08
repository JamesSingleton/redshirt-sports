const { mockPostgres, mockDrizzle } = vi.hoisted(() => ({
  mockPostgres: vi.fn(() => ({})),
  mockDrizzle: vi.fn(() => ({ query: {} })),
}));

vi.mock("postgres", () => ({
  default: mockPostgres,
}));

vi.mock("drizzle-orm/postgres-js", () => ({
  drizzle: mockDrizzle,
}));

vi.mock("@redshirt-sports/db/schema", () => ({
  schools: {},
}));

vi.mock("@/env", () => ({
  env: {
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  },
}));

describe("server/db", () => {
  it("creates a drizzle client with postgres options", async () => {
    const { db } = await import("@/server/db/index");

    expect(mockPostgres).toHaveBeenCalledWith(
      "postgresql://test:test@localhost:5432/test",
      expect.objectContaining({
        prepare: false,
        max: 2,
        idle_timeout: 20,
        max_lifetime: 0,
        connect_timeout: 10,
      }),
    );
    expect(mockDrizzle).toHaveBeenCalled();
    expect(db).toEqual({ query: {} });
  });
});
