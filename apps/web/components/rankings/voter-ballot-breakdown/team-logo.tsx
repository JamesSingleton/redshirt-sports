"use client";

import * as React from "react";

import type { BallotTeam } from "@/types/votes";
import CustomImage from "../../sanity-image";

function TeamLogoBase({
  team,
  size = 40,
}: {
  team: BallotTeam;
  size?: number;
}) {
  return (
    <CustomImage
      image={team.image}
      width={size}
      height={size}
      loading="lazy"
      className="size-10 shrink-0 rounded-sm object-contain"
    />
  );
}

export const TeamLogo = React.memo(TeamLogoBase);
