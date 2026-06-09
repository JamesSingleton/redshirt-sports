"use client";

import * as React from "react";

import type { VoteWithExtraData } from "@/types/votes";
import CustomImage from "../../sanity-image";

function TeamLogoBase({
  vote,
  size = 40,
}: {
  vote: VoteWithExtraData;
  size?: number;
}) {
  return (
    <CustomImage
      image={vote.image}
      width={size}
      height={size}
      loading="lazy"
      className="size-10 shrink-0 rounded-sm object-contain"
    />
  );
}

export const TeamLogo = React.memo(
  TeamLogoBase,
  (prev, next) =>
    prev.size === next.size &&
    prev.vote?._id === next.vote?._id &&
    prev.vote?.image === next.vote?.image &&
    prev.vote?.shortName === next.vote?.shortName,
);
