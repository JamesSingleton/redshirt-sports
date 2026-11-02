import type { Dataset, WithContext } from "schema-dts";

import { getBaseUrl } from "@/lib/get-base-url";
import type { RatingsWeekModel } from "@/lib/ratings/data";
import { RATINGS_METHODOLOGY_PATH } from "@/lib/ratings/format";

export const RATINGS_LICENSE_URL =
  "https://creativecommons.org/licenses/by-nc/4.0/";

/**
 * schema.org Dataset for a published week: who made it, under what license, and
 * what it measures. Helps dataset search and makes the source plain when the
 * numbers are reused.
 */
export function buildRatingsDatasetJsonLd(
  model: RatingsWeekModel,
  path: string,
): WithContext<Dataset> {
  const base = getBaseUrl().replace(/\/$/, "");
  const { pool, week } = model;
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${week.year} ${week.label} ${pool.name} ${pool.sportName} ratings and strength of schedule`,
    description: `Strength of record, power, and strength of schedule for every ${pool.name} team, counting only games between ${pool.name} teams.`,
    url: `${base}${path}`,
    creator: { "@type": "Organization", name: "Redshirt Sports", url: base },
    license: RATINGS_LICENSE_URL,
    isAccessibleForFree: true,
    dateModified: week.publishedAt,
    temporalCoverage: `${week.year}`,
    version: `${model.run.methodVersion}`,
    measurementTechnique: `${base}${RATINGS_METHODOLOGY_PATH}`,
    variableMeasured: [
      "Strength of record",
      "Power rating",
      "Strength of schedule",
      "Strength of victory",
      "Record-based strength of schedule",
    ],
  };
}
