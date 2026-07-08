import { getSchoolIdBySanityId } from "@redshirt-sports/db/queries/transfer-portal";
import { sanityFetchMetadata } from "@redshirt-sports/sanity/live";
import { schoolIdBySlugQuery } from "@redshirt-sports/sanity/queries";
import type { DynamicFetchOptions } from "@redshirt-sports/sanity/live";

export async function resolveSchoolIdBySanitySlug(
  slug: string,
  perspective: DynamicFetchOptions["perspective"],
) {
  const { data: school } = await sanityFetchMetadata({
    query: schoolIdBySlugQuery,
    params: { slug },
    perspective,
  });

  if (!school?._id) {
    return null;
  }

  return getSchoolIdBySanityId(school._id);
}
