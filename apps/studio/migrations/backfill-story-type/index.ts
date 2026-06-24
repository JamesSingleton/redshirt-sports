import { at, defineMigration, setIfMissing } from "sanity/migrate";

export default defineMigration({
  title: "Backfill missing post storyType with news",
  documentTypes: ["post"],
  filter: "!defined(storyType)",
  migrate: {
    document() {
      return [at("storyType", setIfMissing("news"))];
    },
  },
});
