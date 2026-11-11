import { randomUUID } from "node:crypto";
import {
  at,
  create,
  defineMigration,
  type Mutation,
  patch,
  set,
  setIfMissing,
} from "sanity/migrate";

/**
 * Separates an article's format from its beat:
 *
 * - Each existing tag gets a kind: beat, series, or topic.
 * - The Recruiting, Transfer Portal, and NIL beats are created if missing
 *   (they used to be article types, which no production article used).
 * - News articles in a series that has its own format move to that format:
 *   "Game Preview" → Game Preview, the Top 25s → Rankings, Bowl Projections →
 *   Predictions. Only articles still typed News change.
 *
 * Safe to re-run: kinds are only set where missing, beats are only created
 * when no tag has that name, and only News articles change type.
 */
const KIND_BY_NAME: Record<string, "beat" | "series" | "topic"> = {
  "Coaching Changes": "beat",
  "Conference Realignment": "beat",
  "Bowl Projections": "series",
  "FCS Top 25": "series",
  "FBS Top 25": "series",
  "Mid-Major Top 25": "series",
  "Team Preview": "series",
  "Conference Preview": "series",
  // A format, now covered by the Game Preview article type.
  "Game Preview": "topic",
};

const NEW_BEATS = [
  {
    name: "Recruiting",
    slug: "recruiting",
    description: "High school recruiting, commitments, and signing day.",
  },
  {
    name: "Transfer Portal",
    slug: "transfer-portal",
    description:
      "Portal entries, commitments, and roster movement between schools.",
  },
  {
    name: "NIL",
    slug: "nil",
    description:
      "Name, image, and likeness deals, collectives, and revenue sharing.",
  },
];

type Ref = { _ref?: string };

/** Series tags whose articles all share one format. */
const FORMAT_BY_TAG: Record<string, string> = {
  "Game Preview": "game-preview",
  "FCS Top 25": "rankings",
  "FBS Top 25": "rankings",
  "Mid-Major Top 25": "rankings",
  "Bowl Projections": "predictions",
};

let lookups:
  | Promise<{
      existingNames: string[];
      formatTags: Array<{ _id: string; name: string }>;
    }>
  | undefined;
let beatsQueued = false;

export default defineMigration({
  title: "Article formats and beats",
  documentTypes: ["tag", "post"],
  migrate: {
    async document(doc, context) {
      lookups ??= context.client.fetch(
        `{
        "existingNames": *[_type == "tag"].name,
        "formatTags": *[_type == "tag" && name in $names && !(_id in path("drafts.**"))]{_id, name}
      }`,
        { names: Object.keys(FORMAT_BY_TAG) },
      );
      const { existingNames, formatTags } = await lookups;

      if (doc._type === "tag") {
        const mutations: Mutation[] = [];
        const kind = KIND_BY_NAME[doc.name as string] ?? "topic";
        if (!doc.kind) {
          mutations.push(patch(doc._id, [at("kind", setIfMissing(kind))]));
        }

        // Queue the new beats once, alongside the first tag processed.
        if (!beatsQueued) {
          beatsQueued = true;
          for (const beat of NEW_BEATS) {
            if (existingNames.includes(beat.name)) continue;
            mutations.push(
              create({
                _id: randomUUID(),
                _type: "tag",
                name: beat.name,
                kind: "beat",
                description: beat.description,
                slug: { _type: "slug", current: beat.slug },
              }),
            );
          }
        }
        return mutations;
      }

      if (doc.storyType !== "news") return [];
      // The article's first series tag with a format of its own decides.
      const tagIds = ((doc.tags ?? []) as Ref[]).map((tag) => tag._ref);
      const format = tagIds
        .map((id) => formatTags.find((tag) => tag._id === id)?.name)
        .map((name) => (name ? FORMAT_BY_TAG[name] : undefined))
        .find(Boolean);
      return format ? [at("storyType", set(format))] : [];
    },
  },
});
