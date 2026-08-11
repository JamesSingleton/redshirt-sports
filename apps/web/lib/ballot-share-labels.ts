import { weekTitle } from "@redshirt-sports/db/utils/week-mapping";

const SPORT_NAMES: Record<string, string> = {
  football: "College Football",
  "mens-basketball": "Men's College Basketball",
  "womens-basketball": "Women's College Basketball",
};

const DIVISION_NAMES: Record<string, string> = {
  fbs: "FBS",
  fcs: "FCS",
  d2: "Division II",
  d3: "Division III",
  "mid-major": "Mid-Major",
  "power-conferences": "Power Conferences",
};

const DIVISION_LONG_NAMES: Record<string, string> = {
  fbs: "Football Bowl Subdivision (FBS)",
  fcs: "Football Championship Subdivision (FCS)",
  d2: "Division II",
  d3: "Division III",
  "mid-major": "Mid-Major Conferences",
  "power-conferences": "Power Conferences",
};

export function sportDisplayName(sport: string): string {
  return SPORT_NAMES[sport] ?? sport;
}

export function divisionShortName(division: string): string {
  return DIVISION_NAMES[division] ?? division;
}

export function divisionLongName(division: string): string {
  return DIVISION_LONG_NAMES[division] ?? division;
}

export function confirmationTitle(sport: string, division: string): string {
  return `Your ${divisionLongName(division)} ${sportDisplayName(sport)} Top 25 Vote is In!`;
}

export function ballotShareHeadline({
  division,
  week,
}: {
  division: string;
  week: number;
}): string {
  return `My ${divisionShortName(division)} Top 25 — ${weekTitle(week)}`;
}

export function ballotShareTweetText({
  division,
  week,
}: {
  division: string;
  week: number;
}): string {
  return `My ${weekTitle(week)} ${divisionShortName(division)} Top 25 ballot for @RedshirtSports`;
}

export function ballotShareFilename({
  division,
  week,
}: {
  division: string;
  week: number;
}): string {
  const weekSlug =
    week === 0 ? "preseason" : week === 999 ? "final-rankings" : `week${week}`;
  return `redshirt-top25-${division}-${weekSlug}.png`;
}
