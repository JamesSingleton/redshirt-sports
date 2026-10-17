import { defineField, defineType } from "sanity";

export const redirect = defineType({
  name: "redirect",
  title: "Redirect",
  type: "document",
  description: "Redirect for next.config.js",
  fields: [
    defineField({
      name: "source",
      type: "slug",
      validation: (rule) =>
        rule.required().custom((value) => {
          if (!value?.current) return "Can't be blank";
          if (!value.current.startsWith("/")) {
            return "The path must start with a /";
          }
          return true;
        }),
    }),
    defineField({
      name: "destination",
      type: "slug",
      validation: (rule) =>
        rule.required().custom((value) => {
          if (!value?.current) return "Can't be blank";
          if (!value.current.startsWith("/")) {
            return "The path must start with a /";
          }
          return true;
        }),
    }),
    defineField({
      name: "permanent",
      type: "boolean",
      description:
        "Legacy redirects and automatic slug-change redirects are permanent (301). Temporary redirects are not allowed.",
      validation: (rule) =>
        rule
          .required()
          .custom((value) =>
            value === true ? true : "Redirects must be permanent",
          ),
    }),
  ],
  initialValue: {
    permanent: true,
  },
});
