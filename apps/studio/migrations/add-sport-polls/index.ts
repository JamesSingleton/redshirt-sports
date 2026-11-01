import { at, defineMigration, setIfMissing } from "sanity/migrate";

/**
 * Seed each sport's Top 25 polls with the polls that are live today, so the
 * navigation keeps showing them after it switches to Sanity. Sports not
 * listed (e.g. basketball before launch) are left without polls.
 */
const LIVE_POLLS: Record<string, string[]> = {
  football: ["fcs", "fbs"],
};

export default defineMigration({
  title: "Add Top 25 polls to sports",
  documentTypes: ["sport"],
  filter: "!defined(polls)",
  migrate: {
    document(sport) {
      const slug = (sport.slug as { current?: string } | undefined)?.current;
      const polls = slug ? LIVE_POLLS[slug] : undefined;
      if (!polls) return [];

      return [
        at(
          "polls",
          setIfMissing(
            polls.map((poll) => ({
              _key: poll,
              _type: "sportPoll",
              slug: poll,
            })),
          ),
        ),
      ];
    },
  },
});
