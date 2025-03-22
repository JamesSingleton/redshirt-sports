import { getBaseUrl } from "./get-base-url";

import type { Metadata } from "next";

export function getMetaData(data): Metadata {
  const baseUrl = getBaseUrl();

  const meta = {
    title: seoTitle ?? title ?? "",
    description: seoDescription ?? description ?? "",
  }

  return {
    title: `${meta.title} | ${process.env.NEXT_PUBLIC_APP_NAME}`,
  }
}