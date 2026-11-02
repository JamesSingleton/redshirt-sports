import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

export const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

/** CLI commands read the same env files as the web app. */
export function loadCliEnv() {
  const files = [
    path.join(repoRoot, "apps/web/.env.local"),
    path.join(repoRoot, ".env.local"),
  ];
  // First non-empty value wins, so a blank placeholder in one file doesn't hide a real one.
  for (const file of files) {
    const parsed = config({ path: file, quiet: true, processEnv: {} }).parsed;
    for (const [key, value] of Object.entries(parsed ?? {})) {
      if (value !== "" && !process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

export function readFlag(name: string): string | undefined {
  const exact = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (exact) {
    return exact.slice(name.length + 1);
  }
  const index = process.argv.indexOf(name);
  const next = index >= 0 ? process.argv[index + 1] : undefined;
  return next && !next.startsWith("--") ? next : undefined;
}

export function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}
