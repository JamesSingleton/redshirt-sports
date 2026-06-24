import { at, defineMigration, setIfMissing, unset } from "sanity/migrate";

export default defineMigration({
  title: "Rename post mainImage to image",
  documentTypes: ["post"],
  // filter: "defined(mainImage) && !defined(image)",
  filter:
    '_id == "0030eccb-dadd-43af-ad24-5866097221a6" && defined(mainImage) && !defined(image)',
  migrate: {
    document(post) {
      return [
        at("image", setIfMissing(post.mainImage)),
        at("mainImage", unset()),
      ];
    },
  },
});
