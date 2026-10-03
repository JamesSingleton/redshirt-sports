import { PgDialect } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../client", async () => {
  const schema = await import("../../schema");
  return { primaryDb: drizzle.mock({ schema }) };
});

const {
  buildPortalEntryWhere,
  decodePortalCursor,
  derivePortalEventDate,
  encodePortalCursor,
} = await import("../transfer-portal");

const dialect = new PgDialect();

function render(filters: Parameters<typeof buildPortalEntryWhere>[0]) {
  const where = buildPortalEntryWhere(filters);
  if (!where) throw new Error("expected a where clause");
  return dialect.sqlToQuery(where);
}

describe("portal cursor", () => {
  it("round-trips the event date and id", () => {
    const cursor = encodePortalCursor({
      eventDate: new Date("2025-12-09T15:30:00.000Z"),
      id: "entry-1",
    });

    expect(decodePortalCursor(cursor)).toEqual({
      eventDate: new Date("2025-12-09T15:30:00.000Z"),
      id: "entry-1",
    });
  });

  it("rejects missing or malformed cursors", () => {
    expect(decodePortalCursor(undefined)).toBeNull();
    expect(decodePortalCursor("")).toBeNull();
    expect(
      decodePortalCursor(Buffer.from("not-a-date|id").toString("base64url")),
    ).toBeNull();
    expect(
      decodePortalCursor(
        Buffer.from("2025-12-09T00:00:00.000Z").toString("base64url"),
      ),
    ).toBeNull();
  });
});

describe("derivePortalEventDate", () => {
  it("uses the latest status date", () => {
    expect(
      derivePortalEventDate({
        enteredAt: new Date("2025-12-01T00:00:00Z"),
        committedAt: new Date("2025-12-20T00:00:00Z"),
        signedAt: new Date("2025-12-10T00:00:00Z"),
        enrolledAt: null,
        withdrawnAt: null,
      }),
    ).toEqual(new Date("2025-12-20T00:00:00Z"));
  });

  it("falls back to the entered date when nothing else is set", () => {
    expect(
      derivePortalEventDate({ enteredAt: new Date("2025-12-01T00:00:00Z") }),
    ).toEqual(new Date("2025-12-01T00:00:00Z"));
  });
});

describe("buildPortalEntryWhere", () => {
  it("scopes the wire to a sport and portal year", () => {
    const { sql, params } = render({ sportId: "football", portalYear: 2025 });

    expect(sql).toContain('"transfer_portal_entries"."sport_id" = $1');
    expect(sql).toContain('"transfer_portal_entries"."portal_year" = $2');
    expect(params).toEqual(["football", 2025]);
  });

  it("adds status and position filters", () => {
    const { sql, params } = render({
      sportId: "football",
      portalYear: 2025,
      status: "COMMITTED",
      position: "QB",
    });

    expect(sql).toContain('"transfer_portal_entries"."status" = $3');
    expect(sql).toContain('"players"."position" = $4');
    expect(params).toEqual(["football", 2025, "COMMITTED", "QB"]);
  });

  it("matches a conference on either the origin or destination school", () => {
    const { sql, params } = render({
      sportId: "football",
      portalYear: 2025,
      conferenceId: "big-sky",
    });

    expect(sql.match(/exists \(/g)).toHaveLength(2);
    expect(sql).toContain('"from_school"."id"');
    expect(sql).toContain('"to_school"."id"');
    expect(params.filter((param) => param === "big-sky")).toHaveLength(2);
  });

  it("escapes LIKE wildcards in the player search", () => {
    const { sql, params } = render({
      sportId: "football",
      portalYear: 2025,
      search: "  50%_off  ",
    });

    expect(sql).toContain(
      `"players"."first_name" || ' ' || "players"."last_name" ilike`,
    );
    expect(params.at(-1)).toBe("%50\\%\\_off%");
  });

  it("pages after the cursor by event date, then id", () => {
    const cursor = encodePortalCursor({
      eventDate: new Date("2025-12-09T00:00:00.000Z"),
      id: "entry-9",
    });
    const { sql, params } = render({
      sportId: "football",
      portalYear: 2025,
      cursor,
    });

    expect(sql).toContain('"transfer_portal_entries"."event_date" < $3');
    expect(sql).toContain('"transfer_portal_entries"."id" < $5');
    expect(params.slice(2)).toEqual([
      "2025-12-09T00:00:00.000Z",
      "2025-12-09T00:00:00.000Z",
      "entry-9",
    ]);
  });

  it("ignores an invalid cursor instead of failing", () => {
    const { sql } = render({
      sportId: "football",
      portalYear: 2025,
      cursor: "garbage",
    });

    expect(sql).not.toContain("event_date");
  });
});
