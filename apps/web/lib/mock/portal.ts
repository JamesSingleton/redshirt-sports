export const portalMoves = [
  {
    id: "a",
    name: "Example Player A",
    pos: "WR",
    from: "Example Team A",
    to: "Example Team B",
    status: "Committed",
    date: "Oct 12",
  },
  {
    id: "b",
    name: "Example Player B",
    pos: "QB",
    from: "Example Team C",
    to: "Entered portal",
    status: "In portal",
    date: "Oct 11",
  },
  {
    id: "c",
    name: "Example Player C",
    pos: "LB",
    from: "Example Team D",
    to: "Example Team E",
    status: "Visiting",
    date: "Oct 9",
  },
] as const;

export const recruits = [
  {
    id: "r1",
    name: "Example Recruit A",
    pos: "QB",
    school: "Example High School",
    status: "Committed",
    team: "North Dakota State",
  },
  {
    id: "r2",
    name: "Example Recruit B",
    pos: "OL",
    school: "Example High School",
    status: "Offered",
    team: "Montana State",
  },
] as const;
