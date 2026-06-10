import { eq, ilike } from "drizzle-orm";

import { primaryDb as db } from "../client";
import { highSchoolsTable, type InsertHighSchool } from "../schema";

function slugifyHighSchoolName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function findHighSchoolBySlug(slug: string) {
  return db.query.highSchoolsTable.findFirst({
    where: (model, { eq: eqOp }) => eqOp(model.slug, slug),
  });
}

export async function findOrCreateHighSchool(
  input: Pick<InsertHighSchool, "name" | "city" | "state" | "countryCode">,
) {
  const baseSlug = slugifyHighSchoolName(input.name);
  let slug = baseSlug;
  let attempt = 0;

  while (attempt < 5) {
    const existing = await findHighSchoolBySlug(slug);
    if (existing) {
      return existing;
    }

    try {
      const [created] = await db
        .insert(highSchoolsTable)
        .values({
          name: input.name,
          city: input.city,
          state: input.state,
          countryCode: input.countryCode ?? "US",
          slug,
        })
        .returning();

      return created!;
    } catch {
      attempt += 1;
      slug = `${baseSlug}-${attempt}`;
    }
  }

  throw new Error(`Unable to create high school: ${input.name}`);
}

export async function searchHighSchools(query: string, limit = 20) {
  return db
    .select()
    .from(highSchoolsTable)
    .where(ilike(highSchoolsTable.name, `%${query}%`))
    .limit(limit);
}
