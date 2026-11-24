import z from "zod";

import { type FetchJsonOptions, fetchJson } from "../http";

/**
 * One college player's ESPN profile, for pre-filling a new transfer portal
 * player from a pasted ESPN link. Only what the form uses is read.
 */

export type EspnAthleteSport =
  | "football"
  | "mens-basketball"
  | "womens-basketball";

const URL_SPORTS: Record<string, EspnAthleteSport> = {
  "college-football": "football",
  "mens-college-basketball": "mens-basketball",
  "womens-college-basketball": "womens-basketball",
};

const API_PATHS: Record<EspnAthleteSport, string> = {
  football: "football/college-football",
  "mens-basketball": "basketball/mens-college-basketball",
  "womens-basketball": "basketball/womens-college-basketball",
};

/**
 * The sport and player id in an ESPN profile link:
 * https://www.espn.com/college-football/player/_/id/5225414/ty-pennington
 */
export function parseEspnPlayerUrl(
  input: string,
): { sport: EspnAthleteSport; id: string } | null {
  const text = input.trim();
  if (text.length > 300) return null;
  const match =
    /^https?:\/\/(?:www\.)?espn\.com\/([a-z-]+)\/player\/(?:[^?#]*\/)?id\/(\d{1,12})(?:[/?#]|$)/i.exec(
      text,
    );
  const sport = match ? URL_SPORTS[match[1]!.toLowerCase()] : undefined;
  return match && sport ? { sport, id: match[2]! } : null;
}

const athleteSchema = z.object({
  athlete: z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    displayHeight: z.string().optional(),
    displayWeight: z.string().optional(),
    displayBirthPlace: z.string().optional(),
    displayExperience: z.string().optional(),
    position: z.object({ abbreviation: z.string().optional() }).optional(),
    team: z
      .object({ id: z.string(), displayName: z.string().optional() })
      .optional(),
  }),
});

export type EspnAthlete = z.infer<typeof athleteSchema>["athlete"];

export async function fetchEspnAthlete(
  sport: EspnAthleteSport,
  id: string,
  options: FetchJsonOptions = {},
): Promise<EspnAthlete> {
  const url = `https://site.web.api.espn.com/apis/common/v3/sports/${API_PATHS[sport]}/athletes/${encodeURIComponent(id)}`;
  return athleteSchema.parse(
    await fetchJson(url, { retries: 1, timeoutMs: 6000, ...options }),
  ).athlete;
}

const SUFFIXES = ["Jr.", "Sr.", "II", "III", "IV", "V"];

const CLASSES: Record<string, string> = {
  freshman: "FR",
  sophomore: "SO",
  junior: "JR",
  senior: "SR",
  graduate: "GR",
  "graduate student": "GR",
};

/** What the new-player form can take from an ESPN profile. */
export interface EspnPlayerProfile {
  espnId: string;
  firstName: string;
  lastName: string;
  suffix: string;
  hometownCity: string;
  hometownState: string;
  position: string;
  heightIn: number | null;
  weightLb: number | null;
  /** FR, SO, JR, SR, GR: this season's class, as ESPN lists it. */
  classCode: string;
  espnTeamId: string | null;
  teamName: string;
}

export function espnPlayerProfile(athlete: EspnAthlete): EspnPlayerProfile {
  const lastWords = athlete.lastName.trim().split(/\s+/);
  const suffix =
    lastWords.length > 1 && SUFFIXES.includes(lastWords.at(-1)!)
      ? lastWords.pop()!
      : "";
  const height = /^(\d)'\s*(\d{1,2})"?$/.exec(
    athlete.displayHeight?.trim() ?? "",
  );
  const weight = /^(\d{2,3})\s*lbs?$/i.exec(
    athlete.displayWeight?.trim() ?? "",
  );
  // "Sand Springs, OK". Outside the US it's "City, Country": keep the city only.
  const [city = "", region = ""] = (athlete.displayBirthPlace ?? "")
    .split(",")
    .map((part) => part.trim());
  return {
    espnId: athlete.id,
    firstName: athlete.firstName.trim(),
    lastName: lastWords.join(" "),
    suffix,
    hometownCity: city,
    hometownState: /^[A-Z]{2}$/.test(region) ? region : "",
    position: athlete.position?.abbreviation ?? "",
    heightIn: height ? Number(height[1]) * 12 + Number(height[2]) : null,
    weightLb: weight ? Number(weight[1]) : null,
    classCode:
      CLASSES[(athlete.displayExperience ?? "").trim().toLowerCase()] ?? "",
    espnTeamId: athlete.team?.id ?? null,
    teamName: athlete.team?.displayName ?? "",
  };
}
