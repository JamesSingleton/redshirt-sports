import { TwitterIcon } from "@sanity/icons/Twitter";
import { defineField, defineType } from "sanity";

import { PostIdInput } from "@/components/post-id-input";
import TweetPreview from "@/components/tweet";

export const twitter = defineType({
  name: "twitter",
  type: "object",
  title: "X post",
  icon: TwitterIcon,
  fields: [
    defineField({
      name: "id",
      type: "string",
      title: "Post URL or ID",
      description:
        "Paste the post's link from X; only the number at the end is kept.",
      components: { input: PostIdInput },
      validation: (rule) =>
        rule
          .required()
          .regex(/^\d{5,25}$/, { name: "post ID" })
          .error("Paste the post's link, or the number at the end of it."),
    }),
  ],
  preview: { select: { title: "id" } },
  components: { preview: TweetPreview },
});
