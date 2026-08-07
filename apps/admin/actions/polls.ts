"use server";

import {
  createPoll,
  listPolls,
  listSports,
  updatePoll,
} from "@redshirt-sports/db/queries";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/require-admin";

export async function getPollsManagerData() {
  await requireAdmin();
  const [polls, sports] = await Promise.all([
    listPolls({ activeOnly: false }),
    listSports(),
  ]);
  return {
    sports,
    polls: polls.map((poll) => ({
      id: poll.id,
      name: poll.name,
      slug: poll.slug,
      isActive: poll.isActive,
      sportId: poll.sportId,
      sportSlug: poll.sport?.slug ?? "",
      sportName: poll.sport?.name ?? "",
      divisionSportId: poll.divisionSportId,
    })),
  };
}

export async function createPollAction({
  sportId,
  slug,
  name,
  isActive,
}: {
  sportId: string;
  slug: string;
  name: string;
  isActive?: boolean;
}) {
  await requireAdmin();
  const created = await createPoll({ sportId, slug, name, isActive });
  revalidatePath("/polls");
  revalidatePath("/rankings");
  revalidatePath("/voters");
  revalidatePath("/");
  return created;
}

export async function updatePollAction({
  id,
  slug,
  name,
  isActive,
}: {
  id: string;
  slug?: string;
  name?: string;
  isActive?: boolean;
}) {
  await requireAdmin();
  const updated = await updatePoll({ id, slug, name, isActive });
  revalidatePath("/polls");
  revalidatePath("/rankings");
  revalidatePath("/voters");
  revalidatePath("/");
  return updated;
}
