import {
  type DynamicFetchOptions,
  sanityFetchMetadata,
} from "@redshirt-sports/sanity/live";
import {
  sportInfoBySlug,
  sportInfoQuery,
} from "@redshirt-sports/sanity/queries";
import { notFound } from "next/navigation";
import { cache } from "react";

export const requireSportBySlug = cache(
  async (slug: string, perspective: DynamicFetchOptions["perspective"]) => {
    const { data } = await sanityFetchMetadata({
      query: sportInfoBySlug,
      params: { slug },
      perspective,
    });

    if (!data?.title) {
      notFound();
    }

    return { slug, title: data.title };
  },
);

export const fetchAllSports = cache(
  async (perspective: DynamicFetchOptions["perspective"]) => {
    const { data } = await sanityFetchMetadata({
      query: sportInfoQuery,
      perspective,
    });

    return data ?? [];
  },
);
