import type { BracketFormatSpec, BracketGameSpec } from "./types";

/**
 * Checks the guarantees the database cannot: slot and game keys live in the
 * jsonb spec, so nothing else proves the tree is whole. Returns every problem
 * found; an empty list means the spec is usable.
 */
export function validateBracketSpec(spec: BracketFormatSpec): string[] {
  const errors: string[] = [];
  const roundIndex = new Map(
    spec.rounds.map((round, index) => [round.key, index]),
  );
  const gamesByKey = new Map<string, BracketGameSpec>();
  const slotKeys = new Set<string>();

  for (const slot of spec.slots) {
    if (slotKeys.has(slot.key)) errors.push(`duplicate slot ${slot.key}`);
    slotKeys.add(slot.key);
  }
  if (spec.slots.length !== spec.fieldSize) {
    errors.push(
      `fieldSize ${spec.fieldSize} does not match ${spec.slots.length} slots`,
    );
  }

  for (const game of spec.games) {
    if (gamesByKey.has(game.key)) errors.push(`duplicate game ${game.key}`);
    gamesByKey.set(game.key, game);
    const round = spec.rounds[roundIndex.get(game.roundKey) ?? -1];
    if (!round) {
      errors.push(`game ${game.key} has unknown round ${game.roundKey}`);
    } else if (round.label !== game.roundLabel) {
      errors.push(`game ${game.key} label does not match round ${round.key}`);
    }
  }

  const slotUses = new Map<string, number>();
  const feedUses = new Map<string, number>();

  for (const game of spec.games) {
    for (const side of [game.sideA, game.sideB]) {
      if ("slotKey" in side) {
        if (!slotKeys.has(side.slotKey)) {
          errors.push(`game ${game.key} uses unknown slot ${side.slotKey}`);
        }
        slotUses.set(side.slotKey, (slotUses.get(side.slotKey) ?? 0) + 1);
        continue;
      }
      const feeder = gamesByKey.get(side.fromGameKey);
      if (!feeder) {
        errors.push(
          `game ${game.key} is fed by unknown game ${side.fromGameKey}`,
        );
        continue;
      }
      feedUses.set(feeder.key, (feedUses.get(feeder.key) ?? 0) + 1);
      const gameRound = roundIndex.get(game.roundKey);
      const feederRound = roundIndex.get(feeder.roundKey);
      if (
        gameRound !== undefined &&
        feederRound !== undefined &&
        feederRound !== gameRound - 1
      ) {
        errors.push(
          `game ${game.key} is fed by ${feeder.key} from a non-adjacent round`,
        );
      }
    }
  }

  for (const key of slotKeys) {
    const uses = slotUses.get(key) ?? 0;
    if (uses !== 1) errors.push(`slot ${key} is used ${uses} times`);
  }

  const roots = spec.games.filter((game) => !feedUses.has(game.key));
  if (roots.length !== 1) {
    errors.push(`expected one root game, found ${roots.length}`);
  }
  for (const [key, uses] of feedUses) {
    if (uses > 1) errors.push(`game ${key} feeds ${uses} games`);
  }

  return errors;
}

/** The game no other game is fed by: the championship. */
export function rootGame(spec: BracketFormatSpec): BracketGameSpec {
  const fed = new Set<string>();
  for (const game of spec.games) {
    for (const side of [game.sideA, game.sideB]) {
      if ("fromGameKey" in side) fed.add(side.fromGameKey);
    }
  }
  const roots = spec.games.filter((game) => !fed.has(game.key));
  if (roots.length !== 1) {
    throw new Error(`Expected one root game, found ${roots.length}`);
  }
  return roots[0]!;
}

export function specHasSlot(spec: BracketFormatSpec, slotKey: string): boolean {
  return spec.slots.some((slot) => slot.key === slotKey);
}

export function specHasGame(spec: BracketFormatSpec, gameKey: string): boolean {
  return spec.games.some((game) => game.key === gameKey);
}
