export type BracketHost = "higherSeed" | "neutral";

export type BracketSlotSpec = {
  key: string;
  seed: number | null;
  region: string | null;
  showSeed: boolean;
};

export type BracketSideSpec = { slotKey: string } | { fromGameKey: string };

export type BracketGameSpec = {
  key: string;
  roundKey: string;
  roundLabel: string;
  host: BracketHost;
  sideA: BracketSideSpec;
  sideB: BracketSideSpec;
  /**
   * Drawing only: put `sideB` and the games feeding it above `sideA`, to
   * match the official printed bracket. Sides keep their keys, so stored
   * scores and picks are untouched.
   */
  sideBOnTop?: boolean;
};

export type BracketFormatSpec = {
  fieldSize: number;
  rounds: { key: string; label: string }[];
  slots: BracketSlotSpec[];
  games: BracketGameSpec[];
  /** Editor dropdown labels. Not required slots. */
  leagues?: { label: string }[];
};

export type BracketFormatSeed = {
  key: string;
  sportSlug: "football" | "mens-basketball" | "womens-basketball";
  divisionSlug: "fcs" | "fbs" | null;
  effectiveFromYear: number;
  effectiveToYear: number | null;
  spec: BracketFormatSpec;
};
