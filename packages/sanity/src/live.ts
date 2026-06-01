import type {
  DefinedSanityFetchType,
  DefinedSanityLiveProps,
} from "next-sanity/live";
import { defineLive } from "next-sanity/live";
import type { ComponentType } from "react";

import { client } from "./client";
import { token } from "./token";

export const {
  sanityFetch,
  SanityLive,
}: {
  sanityFetch: DefinedSanityFetchType;
  SanityLive: ComponentType<DefinedSanityLiveProps>;
} = defineLive({
  client,
  serverToken: token,
  browserToken: token,
});
