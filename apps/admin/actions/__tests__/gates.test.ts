import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Every Server Action must check its area itself: hiding a nav link or
 * gating a page doesn't stop someone calling the action directly. This
 * fails if an exported action is missing `requireArea`, or checks the wrong
 * area.
 */
const ACTIONS = path.resolve(__dirname, "..");
const AREA_BY_FILE: Record<string, string> = {
  "ballots.ts": "ballots",
  "portal.ts": "portal",
};

const files = readdirSync(ACTIONS).filter((file) => file.endsWith(".ts"));

/** Each exported function's name and body, up to the next top-level export. */
function exportedFunctions(source: string) {
  const starts = [...source.matchAll(/^export async function (\w+)/gm)];
  return starts.map((match, index) => ({
    name: match[1]!,
    body: source.slice(match.index, starts[index + 1]?.index ?? source.length),
  }));
}

describe("server actions check their area", () => {
  it("covers every actions file", () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it.each(files)("%s", (file) => {
    const source = readFileSync(path.join(ACTIONS, file), "utf8");
    const area = AREA_BY_FILE[file] ?? "admin";
    const unguarded = exportedFunctions(source)
      .filter(({ body }) => !body.includes(`requireArea("${area}")`))
      .map(({ name }) => name);
    expect(unguarded).toEqual([]);
  });
});

describe("pages sit behind their area's layout", () => {
  const dashboard = path.resolve(__dirname, "../../app/(dashboard)");
  const layoutArea = (dir: string) =>
    readFileSync(path.join(dashboard, dir, "layout.tsx"), "utf8").match(
      /requireArea\("(\w+)"\)/,
    )?.[1];

  it("gates each section", () => {
    expect(layoutArea("(admin)")).toBe("admin");
    expect(layoutArea("portal")).toBe("portal");
    expect(layoutArea("ballots")).toBe("ballots");
  });

  it("has nothing but home outside a gated section", () => {
    const entries = readdirSync(dashboard, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    expect(entries).toEqual(["(admin)", "ballots", "portal"]);
  });
});
