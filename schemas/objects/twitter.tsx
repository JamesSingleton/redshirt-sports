import React from "react";
import { TwitterTweetEmbed } from "react-twitter-embed";

const Preview = (props) => {
  const { id } = props;
  return <TwitterTweetEmbed tweetId={id} options={{ conversation: "none" }} />;
};

export default {
  name: "twitter",
  type: "object",
  title: "Twitter Embed",
  fields: [
    {
      name: "id",
      type: "string",
      title: "Twitter tweet ID",
    },
  ],
  preview: {
    select: {
      id: "id",
    },
  },
  // components: {
  //   preview: Preview,
  // },
};
