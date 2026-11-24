// Phase 0 baseline. Seed first: psql -d redshirt_perf -v n=20000 -f perf/portal-seed.sql
// Run: DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/redshirt_perf pnpm exec tsx perf/portal-bench.mts
// Runs the portal's real query functions against redshirt_perf and reports wall time.
// DATABASE_URL must point at redshirt_perf on the local Supabase stack.
const root = new URL("../src", import.meta.url).pathname;

if (!process.env.DATABASE_URL?.includes("127.0.0.1:54322/redshirt_perf")) {
  throw new Error(
    "Refusing: DATABASE_URL is not the local redshirt_perf database",
  );
}

const { primaryDb: db } = await import(`${root}/client.ts`);
const wire = await import(`${root}/queries/portal-wire.ts`);
const player = await import(`${root}/queries/portal-player.ts`);
const admin = await import(`${root}/queries/portal-admin.ts`);
const players = await import(`${root}/queries/players.ts`);
const dupes = await import(`${root}/queries/player-duplicates.ts`);
const subs = await import(`${root}/queries/player-submissions.ts`);

const names = [
  "john smith",
  "jalen wil",
  "marcus jo",
  "tre brown",
  "zion parker",
  "deandre hill",
];
const RUNS = 20;

type Case = [string, (i: number) => Promise<unknown>];
const cases: Case[] = [
  [
    "getPublishedWire(football, 2025)",
    () => wire.getPublishedWire("football", 2025),
  ],
  [
    "getPublishedWire(womens-basketball, 2024)",
    () => wire.getPublishedWire("womens-basketball", 2024),
  ],
  [
    "listPublishedWireCycles(football)",
    () => wire.listPublishedWireCycles("football"),
  ],
  [
    "getPublishedPlayer(id)",
    (i) => player.getPublishedPlayer(1 + ((i * 977) % 20000)),
  ],
  ["listIndexablePlayers()", () => player.listIndexablePlayers()],
  [
    "searchPublishedPlayers(name)",
    (i) => player.searchPublishedPlayers(names[i % names.length]),
  ],
  [
    "findSimilarPlayers(name)",
    (i) => players.findSimilarPlayers(names[i % names.length]),
  ],
  ["listPortalPlayers()", () => admin.listPortalPlayers()],
  [
    "getPortalPlayer(id)",
    (i) => admin.getPortalPlayer(1 + ((i * 613) % 20000)),
  ],
  ["listDuplicateCandidates()", () => dupes.listDuplicateCandidates()],
  [
    "listPlayerSubmissions(new)",
    () => subs.listPlayerSubmissions({ status: "new" }),
  ],
];

const snap = async () =>
  new Map(
    (
      await db.$client.unsafe(
        `select queryid::text id, calls, total_exec_time t, shared_blks_hit + shared_blks_read b, rows, left(regexp_replace(query, '\\s+', ' ', 'g'), 170) q from extensions.pg_stat_statements where dbid = (select oid from pg_database where datname = current_database())`,
      )
    ).map((r: any) => [r.id, r]),
  );
const before = await snap();
const results: Array<Record<string, unknown>> = [];
for (const [label, run] of cases) {
  const ms: number[] = [];
  let size = 0;
  for (let i = 0; i < RUNS; i++) {
    const t = performance.now();
    const out = await run(i);
    ms.push(performance.now() - t);
    if (i === 0) size = Buffer.byteLength(JSON.stringify(out ?? null));
  }
  ms.sort((a, b) => a - b);
  results.push({
    label,
    p50: +ms[Math.floor(RUNS / 2)].toFixed(1),
    p95: +ms[Math.floor(RUNS * 0.95) - 1].toFixed(1),
    resultKB: +(size / 1024).toFixed(1),
  });
}
console.table(results);

const after = await snap();
const top = [...after.values()]
  .map((r: any) => {
    const b: any = before.get(r.id) ?? { calls: 0, t: 0, b: 0, rows: 0 };
    return {
      calls: Number(r.calls) - Number(b.calls),
      total_ms: +(r.t - b.t).toFixed(1),
      blocks: Number(r.b) - Number(b.b),
      rows: Number(r.rows) - Number(b.rows),
      q: r.q,
    };
  })
  .filter((r) => r.calls > 0 && !/pg_stat_statements/.test(r.q))
  .sort((a, b) => b.total_ms - a.total_ms)
  .slice(0, 15)
  .map((r) => ({ ...r, mean_ms: +(r.total_ms / r.calls).toFixed(2) }));
console.table(top);
process.exit(0);
