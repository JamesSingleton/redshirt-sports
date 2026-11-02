"use server";

import {
  createPoll,
  listAutoPublishSchedule,
  listPolls,
  listSports,
  updatePoll,
} from "@redshirt-sports/db/queries";
import { revalidatePath } from "next/cache";

import { describeAutoPublish } from "@/lib/auto-publish-label";
import { requireAdmin } from "@/lib/require-admin";

export async function getPollsManagerData() {
  await requireAdmin();
  const [polls, sports, schedule] = await Promise.all([
    listPolls({ activeOnly: false }),
    listSports(),
    listAutoPublishSchedule(),
  ]);
  return {
    sports,
    polls: polls.map((poll) => ({
      id: poll.id,
      name: poll.name,
      slug: poll.slug,
      isActive: poll.isActive,
      autoPublish: poll.autoPublish,
      autoPublishLabel: (() => {
        const next = schedule.get(poll.id);
        return next ? describeAutoPublish(next) : null;
      })(),
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
  autoPublish,
}: {
  id: string;
  slug?: string;
  name?: string;
  isActive?: boolean;
  autoPublish?: boolean;
}) {
  await requireAdmin();
  const updated = await updatePoll({ id, slug, name, isActive, autoPublish });
  revalidatePath("/polls");
  revalidatePath("/rankings");
  revalidatePath("/voters");
  revalidatePath("/");
  return updated;
}
