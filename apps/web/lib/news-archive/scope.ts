export type NewsArchiveScope =
  | { type: "college" }
  | { type: "sport"; sport: string }
  | { type: "division"; sport: string; division: string }
  | {
      type: "conference";
      sport: string;
      division: string;
      conference: string;
    };
