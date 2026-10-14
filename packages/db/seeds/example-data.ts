/**
 * Local-only example seed: fake schools, voters, ballots, and one published week.
 * Idempotent. Never prints secrets. Refuses a non-local DATABASE_URL.
 */
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { config } from "dotenv";

const envFile = resolve(process.cwd(), "../../apps/web/.env.local");
config({ path: envFile });
execFileSync(
  process.execPath,
  [resolve(process.cwd(), "../../scripts/assert-local-env.mjs"), envFile],
  { stdio: "inherit" },
);

async function main() {
  const { sql } = await import("drizzle-orm");
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const postgres = (await import("postgres")).default;
  const schema = await import("../src/schema");

  const {
    SEASON_TYPE_CODES,
    ballotEntriesTable,
    ballotsTable,
    divisionSportsTable,
    divisionsTable,
    pollRankingsTable,
    pollVotersTable,
    pollsTable,
    schoolsTable,
    seasonTypesTable,
    seasonsTable,
    sportsTable,
    usersTable,
    weeksTable,
  } = schema;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is missing from apps/web/.env.local");
    process.exit(1);
  }

  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client, { schema, casing: "snake_case" });

  const FOOTBALL_ID = "fixture-sport-football";
  const MBB_ID = "fixture-sport-mens-basketball";
  const FCS_DIVISION_ID = "fixture-division-fcs";
  const MID_MAJOR_ID = "fixture-division-mid-major";
  const FCS_DIVISION_SPORT_ID = "fixture-ds-football-fcs";
  const MID_MAJOR_DIVISION_SPORT_ID = "fixture-ds-mbb-mid-major";
  const FCS_POLL_ID = "fixture-poll-football-fcs";
  const MID_MAJOR_POLL_ID = "fixture-poll-mbb-mid-major";
  const FOOTBALL_SEASON_ID = "fixture-season-football-2026";
  const MBB_SEASON_ID = "fixture-season-mbb-2026";
  const FB_PRESEASON_TYPE_ID = "fixture-st-football-preseason";
  const FB_REGULAR_TYPE_ID = "fixture-st-football-regular";
  const MBB_REGULAR_TYPE_ID = "fixture-st-mbb-regular";
  const PUBLISHED_WEEK_ID = "fixture-week-football-regular-6";
  const BALLOT_WEEK_ID = "fixture-week-football-regular-7";
  const YEAR = 2026;
  const VOTER_COUNT = 12;
  const BALLOT_SIZE = 25;

  const SCHOOLS = [
    ["Example State", "Examples", "EXST"],
    ["Sample Tech", "Samples", "SAMP"],
    ["Fixture University", "Fixtures", "FIXU"],
    ["Placeholder College", "Placeholders", "PLAC"],
    ["Demo A&M", "Demos", "DEMO"],
    ["Mock State", "Mocks", "MOCK"],
    ["Practice University", "Practices", "PRAC"],
    ["Sandbox College", "Sandboxes", "SAND"],
    ["Tutorial Tech", "Tutorials", "TUTL"],
    ["Specimen University", "Specimens", "SPEC"],
    ["Hypothetical State", "Hypotheticals", "HYPO"],
    ["Nominal College", "Nominals", "NOML"],
    ["Synthetic Tech", "Synthetics", "SYNT"],
    ["Template University", "Templates", "TMPL"],
    ["Dummy State", "Dummies", "DUMY"],
    ["Stand-in College", "Stand-ins", "STND"],
    ["Prototype Tech", "Prototypes", "PROT"],
    ["Illustrative University", "Illustratives", "ILST"],
    ["Notional State", "Notionals", "NOTL"],
    ["Generic College", "Generics", "GENC"],
    ["Fictional Tech", "Fictionals", "FCTL"],
    ["Imaginary University", "Imaginaries", "IMAG"],
    ["Pretend State", "Pretends", "PRTD"],
    ["Artificial College", "Artificials", "ARTF"],
    ["Invented Tech", "Inventeds", "INVT"],
    ["Constructed University", "Constructeds", "CNST"],
    ["Simulated State", "Simulateds", "SIMU"],
    ["Theoretical College", "Theoreticals", "THEO"],
    ["Reference Tech", "References", "REFR"],
    ["Outline University", "Outlines", "OUTL"],
  ] as const;

  function slugify(value: string) {
    return value
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function schoolId(index: number) {
    return `fixture-school-${String(index + 1).padStart(2, "0")}`;
  }

  function userId(index: number) {
    return `user_fixture_${String(index + 1).padStart(2, "0")}`;
  }

  function mulberry32(seed: number) {
    let state = seed;
    return () => {
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle<T>(items: T[], seed: number) {
    const next = mulberry32(seed);
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      const swap = copy[i];
      copy[i] = copy[j] as T;
      copy[j] = swap as T;
    }
    return copy;
  }

  function atUtc(iso: string) {
    return new Date(iso);
  }

  async function seed() {
    await db
      .insert(sportsTable)
      .values([
        {
          id: FOOTBALL_ID,
          slug: "football",
          name: "Football",
          displayName: "College Football",
          isActive: true,
        },
        {
          id: MBB_ID,
          slug: "mens-basketball",
          name: "Men's Basketball",
          displayName: "Men's College Basketball",
          isActive: true,
        },
      ])
      .onConflictDoNothing();

    await db
      .insert(divisionsTable)
      .values([
        {
          id: FCS_DIVISION_ID,
          name: "FCS",
          title: "FCS",
          heading: "FCS",
          longName: "Example FCS",
          sanityId: "fixture.division.fcs",
          slug: "fcs",
          isSubdivision: true,
        },
        {
          id: MID_MAJOR_ID,
          name: "Mid-Major",
          title: "Mid-Major",
          heading: "Mid-Major",
          longName: "Example Mid-Major",
          sanityId: "fixture.division.mid-major",
          slug: "mid-major",
          isSubdivision: true,
        },
      ])
      .onConflictDoNothing();

    await db
      .insert(divisionSportsTable)
      .values([
        {
          id: FCS_DIVISION_SPORT_ID,
          sportId: FOOTBALL_ID,
          divisionId: FCS_DIVISION_ID,
        },
        {
          id: MID_MAJOR_DIVISION_SPORT_ID,
          sportId: MBB_ID,
          divisionId: MID_MAJOR_ID,
        },
      ])
      .onConflictDoNothing();

    await db
      .insert(pollsTable)
      .values([
        {
          id: FCS_POLL_ID,
          sportId: FOOTBALL_ID,
          slug: "fcs",
          name: "Example FCS Top 25",
          isActive: true,
          divisionSportId: FCS_DIVISION_SPORT_ID,
        },
        {
          id: MID_MAJOR_POLL_ID,
          sportId: MBB_ID,
          slug: "mid-major",
          name: "Example Mid-Major Top 25",
          isActive: true,
          divisionSportId: MID_MAJOR_DIVISION_SPORT_ID,
        },
      ])
      .onConflictDoNothing();

    await db
      .insert(seasonsTable)
      .values([
        {
          id: FOOTBALL_SEASON_ID,
          year: YEAR,
          displayName: "2026 Example Football",
          startDate: atUtc("2026-08-01T00:00:00Z"),
          endDate: atUtc("2027-01-15T00:00:00Z"),
          sportId: FOOTBALL_ID,
        },
        {
          id: MBB_SEASON_ID,
          year: YEAR,
          displayName: "2026-27 Example Men's Basketball",
          startDate: atUtc("2026-11-01T00:00:00Z"),
          endDate: atUtc("2027-04-15T00:00:00Z"),
          sportId: MBB_ID,
        },
      ])
      .onConflictDoNothing();

    await db
      .insert(seasonTypesTable)
      .values([
        {
          id: FB_PRESEASON_TYPE_ID,
          type: SEASON_TYPE_CODES.PRESEASON,
          startDate: atUtc("2026-08-01T00:00:00Z"),
          endDate: atUtc("2026-08-22T00:00:00Z"),
          seasonId: FOOTBALL_SEASON_ID,
        },
        {
          id: FB_REGULAR_TYPE_ID,
          type: SEASON_TYPE_CODES.REGULAR_SEASON,
          startDate: atUtc("2026-08-29T00:00:00Z"),
          endDate: atUtc("2026-11-28T00:00:00Z"),
          seasonId: FOOTBALL_SEASON_ID,
        },
        {
          id: MBB_REGULAR_TYPE_ID,
          type: SEASON_TYPE_CODES.REGULAR_SEASON,
          startDate: atUtc("2026-11-03T00:00:00Z"),
          endDate: atUtc("2027-03-01T00:00:00Z"),
          seasonId: MBB_SEASON_ID,
        },
      ])
      .onConflictDoNothing();

    const footballWeeks = [
      {
        id: "fixture-week-football-preseason-1",
        number: 1,
        text: "Preseason",
        seasonTypeId: FB_PRESEASON_TYPE_ID,
        startDate: atUtc("2026-08-01T00:00:00Z"),
        endDate: atUtc("2026-08-22T00:00:00Z"),
      },
      ...Array.from({ length: 7 }, (_, index) => {
        const week = index + 1;
        const start = new Date(Date.UTC(2026, 7, 29 + (week - 1) * 7));
        const end = new Date(start);
        end.setUTCDate(end.getUTCDate() + 6);
        return {
          id: `fixture-week-football-regular-${week}`,
          number: week,
          text: `Week ${week}`,
          seasonTypeId: FB_REGULAR_TYPE_ID,
          startDate: start,
          endDate: end,
        };
      }),
    ];

    await db.insert(weeksTable).values(footballWeeks).onConflictDoNothing();
    await db
      .insert(weeksTable)
      .values([
        {
          id: "fixture-week-mbb-regular-1",
          number: 1,
          text: "Week 1",
          seasonTypeId: MBB_REGULAR_TYPE_ID,
          startDate: atUtc("2026-11-03T00:00:00Z"),
          endDate: atUtc("2026-11-09T00:00:00Z"),
        },
      ])
      .onConflictDoNothing();

    await db
      .insert(schoolsTable)
      .values(
        SCHOOLS.map(([name, nickname, abbreviation], index) => ({
          id: schoolId(index),
          name,
          shortName: name,
          nickname,
          abbreviation,
          sanityId: `fixture.school.${String(index + 1).padStart(2, "0")}`,
          slug: `${slugify(name)}-${slugify(nickname)}`,
          top25Eligible: index < BALLOT_SIZE,
        })),
      )
      .onConflictDoNothing();

    await db
      .insert(usersTable)
      .values(
        Array.from({ length: VOTER_COUNT }, (_, index) => ({
          id: userId(index),
          firstName: "Example",
          lastName: `Voter ${index + 1}`,
          organization: "Example Media",
          organizationRole: "Example Writer",
          isAdmin: false,
          isVoter: true,
        })),
      )
      .onConflictDoNothing();

    await db
      .insert(pollVotersTable)
      .values(
        Array.from({ length: VOTER_COUNT }, (_, index) => ({
          id: `fixture-poll-voter-${String(index + 1).padStart(2, "0")}`,
          pollId: FCS_POLL_ID,
          userId: userId(index),
        })),
      )
      .onConflictDoNothing();

    const ballotSchoolIds = Array.from({ length: BALLOT_SIZE }, (_, index) =>
      schoolId(index),
    );

    for (let voter = 0; voter < VOTER_COUNT; voter++) {
      const ballotId = `fixture-ballot-week7-${String(voter + 1).padStart(2, "0")}`;
      const inserted = await db
        .insert(ballotsTable)
        .values({
          id: ballotId,
          pollId: FCS_POLL_ID,
          userId: userId(voter),
          weekId: BALLOT_WEEK_ID,
          submittedAt: atUtc("2026-10-12T15:00:00Z"),
        })
        .onConflictDoNothing()
        .returning({ id: ballotsTable.id });

      if (!inserted[0]) continue;

      const ranking = shuffle(ballotSchoolIds, 42 + voter);
      await db.insert(ballotEntriesTable).values(
        ranking.map((id, index) => ({
          id: `${ballotId}-rank-${String(index + 1).padStart(2, "0")}`,
          ballotId,
          schoolId: id,
          rank: index + 1,
          points: BALLOT_SIZE - index,
        })),
      );
    }

    const published = SCHOOLS.slice(0, BALLOT_SIZE).map((_, index) => ({
      id: `fixture-ranking-week6-${String(index + 1).padStart(2, "0")}`,
      pollId: FCS_POLL_ID,
      weekId: PUBLISHED_WEEK_ID,
      schoolId: schoolId(index),
      rank: index + 1,
      points: (BALLOT_SIZE - index) * VOTER_COUNT,
      firstPlaceVotes: index === 0 ? VOTER_COUNT : 0,
      isTie: false,
    }));
    const othersReceivingVotes = SCHOOLS.slice(BALLOT_SIZE).map((_, offset) => {
      const index = BALLOT_SIZE + offset;
      return {
        id: `fixture-ranking-week6-orv-${String(offset + 1).padStart(2, "0")}`,
        pollId: FCS_POLL_ID,
        weekId: PUBLISHED_WEEK_ID,
        schoolId: schoolId(index),
        rank: null,
        points: VOTER_COUNT - offset,
        firstPlaceVotes: 0,
        isTie: false,
      };
    });

    await db
      .insert(pollRankingsTable)
      .values([...published, ...othersReceivingVotes])
      .onConflictDoNothing();

    const [schools, voters, ballots, rankings] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(schoolsTable),
      db.select({ count: sql<number>`count(*)::int` }).from(usersTable),
      db.select({ count: sql<number>`count(*)::int` }).from(ballotsTable),
      db.select({ count: sql<number>`count(*)::int` }).from(pollRankingsTable),
    ]);

    console.log("Example seed complete (fake data only).");
    console.log(`  schools: ${schools[0]?.count ?? 0}`);
    console.log(`  users: ${voters[0]?.count ?? 0}`);
    console.log(`  ballots: ${ballots[0]?.count ?? 0}`);
    console.log(`  poll_rankings: ${rankings[0]?.count ?? 0}`);
    console.log(
      "  published week: /college/football/rankings/fcs/2026/6 (regular week 6)",
    );
  }

  try {
    await seed();
  } catch (error) {
    console.error("Example seed failed:", error);
    process.exitCode = 1;
  } finally {
    await client.end({ timeout: 5 });
  }
}

main();
