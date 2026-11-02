/**
 * pnpm ratings <command> --sport football --pool fcs --season 2025 [--week 10 | --all] [--force]
 *
 *   sync      Pull members and games for the weeks (default: every rateable week).
 *   compute   Compute draft runs for the weeks.
 *   publish   Compute (if needed) and publish the weeks. Refuses unmapped members unless --force.
 *             Without --week, only weeks that have ended (the cron handles the current one).
 *   pipeline  What the cron does right now (respects --now <ISO>; --any-time ignores the window).
 *   status    Members, games, and runs per week.
 *
 * Writes go to DATABASE_URL. Anything but a local database needs --allow-remote.
 */
import { assertLocalDatabaseUrl } from "../src/utils/local-database";
import { hasFlag, loadCliEnv, readFlag } from "./cli-env";

loadCliEnv();
if (!hasFlag("--allow-remote")) {
  assertLocalDatabaseUrl(process.env.DATABASE_URL);
}

const ratings = await import("../src/ratings");
const { primaryDb: db } = await import("../src/client");
const { sql } = await import("drizzle-orm");

const command = process.argv[2];
const sport = readFlag("--sport") ?? "football";
const poolSlug = readFlag("--pool") ?? "fcs";
const pool = await ratings.getPool(sport, poolSlug);
const log = (line: string) => console.log(`• ${line}`);

async function calendarAndWeeks() {
  const season = Number(readFlag("--season"));
  if (!Number.isInteger(season)) throw new Error("Pass --season YYYY.");
  const calendar = await ratings.loadSeasonCalendar(pool.sportId, season);
  const weekFlag = readFlag("--week");
  const weeks = weekFlag
    ? calendar.weeks.filter((week) =>
        weekFlag === "post"
          ? week.seasonType === 3
          : week.seasonType === 2 && week.number === Number(weekFlag),
      )
    : calendar.weeks;
  if (weeks.length === 0) throw new Error(`No week ${weekFlag} in ${season}.`);
  return { calendar, weeks };
}

async function computeWeeks(publish: boolean) {
  const { calendar, weeks: requested } = await calendarAndWeeks();
  // A whole-season run only includes weeks that are over: ended on the calendar,
  // or with games played and nothing left to play. The cron owns the week in progress.
  const now = new Date();
  const memberIds = (await ratings.loadMembers(pool.id, calendar.seasonId)).map(
    (member) => member.schoolId,
  );
  const weeks: typeof requested = [];
  for (const week of requested) {
    if (readFlag("--week") || week.endDate <= now) {
      weeks.push(week);
      continue;
    }
    const status = ratings.weekStatus(
      await ratings.loadWeekGames(calendar, week, memberIds),
      now,
    );
    if (status.complete) weeks.push(week);
  }
  if (weeks.length < requested.length) {
    log(
      `Skipping ${requested.length - weeks.length} week(s) still to be played.`,
    );
  }
  const inputs = await ratings.loadRatingInputs(pool, calendar);
  for (const week of weeks) {
    const started = performance.now();
    const outcome = await ratings.computeRun({
      pool,
      calendar,
      week,
      trigger: "cli",
      force: hasFlag("--force"),
      inputs,
    });
    const ms = Math.round(performance.now() - started);
    if (outcome.status === "skipped") {
      log(`${week.label}: skipped (${outcome.reason})`);
    } else {
      const top = outcome.result.teams
        .slice(0, 3)
        .map((t) => `${t.name} SOR ${(t.sor ?? 0).toFixed(3)}`);
      log(
        `${week.label}: ${outcome.result.diagnostics.poolGamesPlayed} games, ${ms} ms. ${top.join("; ")}`,
      );
    }
    if (publish) {
      await ratings.publishRun(outcome.runId, "cli", {
        allowBlockers: hasFlag("--force"),
      });
      log(`${week.label}: published`);
    }
  }
}

switch (command) {
  case "sync": {
    const { calendar, weeks } = await calendarAndWeeks();
    await ratings.withJob(
      {
        poolId: pool.id,
        kind: "sync",
        trigger: "cli",
        request: { season: calendar.year, weeks: weeks.length },
      },
      async (job) => {
        await ratings.syncPoolWeeks({
          pool,
          calendar,
          weeks,
          now: new Date(),
          log: (line) => {
            job.log(line);
            log(line);
          },
        });
        return { value: null };
      },
    );
    break;
  }
  case "compute":
    await computeWeeks(false);
    break;
  case "publish":
    await computeWeeks(true);
    break;
  case "pipeline": {
    const now = readFlag("--now");
    const result = await ratings.runPipeline({
      pool,
      trigger: "cli",
      now: now ? new Date(now) : undefined,
      ignoreSchedule: hasFlag("--any-time"),
    });
    for (const line of result.lines) log(line);
    log(`${result.status}: ${result.message}`);
    break;
  }
  case "status": {
    const rows = await db.execute(sql`
      select w.text as week, count(distinct r.id) as runs,
             max(case when r.status = 'published' then r.computed_at end) as published
      from rating_runs r join weeks w on w.id = r.week_id
      where r.pool_id = ${pool.id}
      group by w.text, w.start_date order by w.start_date
    `);
    console.table(rows);
    break;
  }
  default:
    console.log("Commands: sync | compute | publish | pipeline | status");
}

await (await import("../src/client")).primaryDb.$client.end();
