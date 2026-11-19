/**
 * A Top 25 ballot as one school id per slot, in rank order, with `""` for an
 * empty slot. These functions never change the array they're given.
 */
export type Ballot = readonly string[];

export type Placed = {
  ballot: string[];
  /** The school pushed off the bottom of a full ballot, if any. */
  dropped?: string;
};

/** Moves the pick at `from` to `to`, sliding the picks between to close the gap. */
export function moveTeam(ballot: Ballot, from: number, to: number): string[] {
  const next = [...ballot];
  const [team] = next.splice(from, 1);
  next.splice(to, 0, team as string);
  return next;
}

/** Empties one slot. The other picks stay where they are. */
export function clearSlot(ballot: Ballot, index: number): string[] {
  const next = [...ballot];
  next[index] = "";
  return next;
}

/**
 * Puts a school in a slot. A school already on the ballot moves there. An
 * empty slot just fills. A filled slot takes the school and pushes the picks
 * below it down one, into the next empty slot, or, on a full ballot, pushes
 * the last pick off.
 */
export function placeTeam(ballot: Ballot, index: number, team: string): Placed {
  const current = ballot.indexOf(team);
  if (current === index) return { ballot: [...ballot] };
  if (current !== -1) return { ballot: moveTeam(ballot, current, index) };
  if (!ballot[index]) {
    const next = [...ballot];
    next[index] = team;
    return { ballot: next };
  }
  const empty = ballot.indexOf("", index);
  const next = [...ballot];
  const [dropped] = next.splice(empty === -1 ? next.length - 1 : empty, 1);
  next.splice(index, 0, team);
  return dropped ? { ballot: next, dropped } : { ballot: next };
}
