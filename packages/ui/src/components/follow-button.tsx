"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import { useState } from "react";

export function FollowButton({ name }: { name: string }) {
  const [following, setFollowing] = useState(false);
  return (
    <Button
      type="button"
      variant={following ? "secondary" : "default"}
      aria-pressed={following}
      onClick={() => setFollowing((current) => !current)}
    >
      {following ? `Following ${name}` : `Follow ${name}`}
    </Button>
  );
}
