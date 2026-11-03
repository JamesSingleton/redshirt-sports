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
