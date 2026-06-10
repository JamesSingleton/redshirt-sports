import { randomBytes } from "node:crypto";

import { init } from "@paralleldrive/cuid2";

const createId = init({
  length: 24,
  random: () => randomBytes(1)[0]! / 256,
});

export function createPublicId(): string {
  return createId();
}

/** Extract cuid2 public_id from a profile URL path segment (e.g. elmir-dzafic-abc...). */
export function parsePublicIdFromPath(pathSegment: string): string {
  if (pathSegment.length === 24) {
    return pathSegment;
  }

  const match = pathSegment.match(/([a-z0-9]{24})$/);
  return match?.[1] ?? pathSegment;
}
