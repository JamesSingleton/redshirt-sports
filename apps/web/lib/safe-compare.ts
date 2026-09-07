import { timingSafeEqual } from "node:crypto";

/**
 * Constant-time string comparison safe against timing attacks.
 * Compares byte lengths before timingSafeEqual to avoid RangeError on
 * multi-byte UTF-8 when string lengths differ.
 */
export function safeCompare(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }

  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}
