import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  PUBLISHED_FETCH_OPTIONS,
} from "@redshirt-sports/sanity/live";
import { draftMode } from "next/headers";

/** Layer-1 draft/runtime branch — use outside `"use cache"` scopes only. */
export async function resolveDynamicFetchOptions(): Promise<DynamicFetchOptions> {
  const { isEnabled: isDraftMode } = await draftMode();
  if (isDraftMode) {
    return getDynamicFetchOptions();
  }
  return PUBLISHED_FETCH_OPTIONS;
}
