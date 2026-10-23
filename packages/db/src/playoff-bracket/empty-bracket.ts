import type {
  BracketFormatSpec,
  BracketSideSpec,
  Skeleton,
  SkeletonGame,
} from "./types";

function sideKeys(side: BracketSideSpec): {
  slotKey: string | null;
  fromGameKey: string | null;
} {
  if ("slotKey" in side) {
    return { slotKey: side.slotKey, fromGameKey: null };
  }
  return { slotKey: null, fromGameKey: side.fromGameKey };
}

/**
 * Builds the empty slot and game rows for a format.
 * Does not read a poll and does not assign schools.
 * `homeSide` stays null. The renderer applies `host` when the editor has not set a side.
 */
export function emptyBracket(spec: BracketFormatSpec): Skeleton {
  const slots = spec.slots.map((slot) => ({
    slotKey: slot.key,
    seed: slot.seed,
    region: slot.region,
    showSeed: slot.showSeed,
    schoolId: null as null,
  }));

  const games: SkeletonGame[] = spec.games.map((game) => {
    const sideA = sideKeys(game.sideA);
    const sideB = sideKeys(game.sideB);
    return {
      gameKey: game.key,
      roundKey: game.roundKey,
      roundLabel: game.roundLabel,
      host: game.host,
      sideASlotKey: sideA.slotKey,
      sideBSlotKey: sideB.slotKey,
      sideAFromGameKey: sideA.fromGameKey,
      sideBFromGameKey: sideB.fromGameKey,
      homeSide: null,
    };
  });

  return { slots, games };
}
