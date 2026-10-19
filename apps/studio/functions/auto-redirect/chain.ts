export type RedirectRow = {
  _id: string;
  source: string;
};

/**
 * When path A moves to B, redirects that currently land on A should land on B.
 * Skip a row whose source is A (that is the new redirect itself) or B
 * (repointing it would make B point at B).
 */
export function redirectsToRepoint(
  rows: readonly RedirectRow[],
  source: string,
  destination: string,
): RedirectRow[] {
  return rows.filter(
    (row) => row.source !== source && row.source !== destination,
  );
}
