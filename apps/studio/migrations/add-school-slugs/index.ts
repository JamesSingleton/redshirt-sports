import { createClient } from "@sanity/client";
import slugify from "slugify";

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID!,
  dataset: process.env.SANITY_STUDIO_DATASET!,
  apiVersion: "2025-02-06",
  token: process.env.SANITY_DEPLOY_TOKEN,
  useCdn: false,
});

function buildSchoolSlug(shortName: string, nickname?: string | null) {
  const schoolPart = slugify(shortName, { lower: true, strict: true });
  if (!nickname) return schoolPart;
  const nicknamePart = slugify(nickname, { lower: true, strict: true });
  return `${schoolPart}-${nicknamePart}`;
}

async function migrate() {
  const schools = await client.fetch<
    Array<{
      _id: string;
      name: string;
      shortName?: string;
      nickname?: string;
      slug?: { current?: string };
    }>
  >(`*[_type == "school" && !defined(slug.current)]{
    _id,
    name,
    shortName,
    nickname,
    slug
  }`);

  console.log(`Found ${schools.length} schools without slugs`);

  for (const school of schools) {
    const source = school.shortName || school.name;
    if (!source) continue;

    const slug = buildSchoolSlug(source, school.nickname);

    await client
      .patch(school._id)
      .set({ slug: { _type: "slug", current: slug } })
      .commit();

    console.log(`Set slug for ${school.name}: ${slug}`);
  }
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
