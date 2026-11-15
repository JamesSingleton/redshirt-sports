"use server";

import {
  excuseBallotAhead,
  listPollAttendance,
  reinstateLockedOutVoter,
  removeAdvanceExcuse,
  setMissedBallotExcused,
} from "@redshirt-sports/db/queries";
import { revalidatePath } from "next/cache";

import { requireArea } from "@/lib/access";
import { timedStep } from "@/lib/slow-steps";

export async function getAttendanceData() {
  await requireArea("admin");
  return timedStep("home: poll attendance", () => listPollAttendance());
}

export async function excuseMissedBallot({
  id,
  excused,
  note,
}: {
  id: string;
  excused: boolean;
  note?: string;
}) {
  await requireArea("admin");
  if (!id) throw new Error("id is required");
  await setMissedBallotExcused({ id, excused, note });
  revalidatePath("/");
}

export async function reinstateVoter({
  pollId,
  userId,
}: {
  pollId: string;
  userId: string;
}) {
  await requireArea("admin");
  if (!pollId || !userId) throw new Error("pollId and userId are required");
  await reinstateLockedOutVoter({ pollId, userId });
  revalidatePath("/");
  revalidatePath("/voters");
}

export async function excuseAhead({
  pollId,
  userId,
  weekId,
  note,
}: {
  pollId: string;
  userId: string;
  weekId: string;
  note?: string;
}) {
  await requireArea("admin");
  if (!pollId || !userId || !weekId) {
    throw new Error("pollId, userId, and weekId are required");
  }
  await excuseBallotAhead({ pollId, userId, weekId, note });
  revalidatePath("/");
}

export async function removeExcuseAhead({ id }: { id: string }) {
  await requireArea("admin");
  if (!id) throw new Error("id is required");
  await removeAdvanceExcuse({ id });
  revalidatePath("/");
}
