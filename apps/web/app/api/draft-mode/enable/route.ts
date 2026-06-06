import { client } from "@redshirt-sports/sanity/client";
import { token } from "@redshirt-sports/sanity/token";
import { defineEnableDraftMode } from "next-sanity/draft-mode";

export const { GET } = defineEnableDraftMode({
  client: client.withConfig({ token }),
});
