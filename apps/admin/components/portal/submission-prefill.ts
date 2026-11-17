import type { PlayerSubmission } from "@redshirt-sports/db/queries";

import { type EntryValue, emptyEntry } from "@/components/portal/entry-fields";
import { EMPTY_SOURCE } from "@/components/portal/fields";
import type { BioValue } from "@/components/portal/new-player-form";

type Payload = NonNullable<PlayerSubmission["payload"]>;

/** `2026-01-15` as the form's `datetime-local` value, at noon so no zone shifts the day. */
const atNoon = (day: string) => `${day}T12:00`;

/**
 * The Add player form, started from a public submission. Runs in the form
 * (a client component): its inputs' empty values live in client modules. Only what they
 * told us is filled in; the editor still picks the school from the list and
 * checks the rest. Their link and who sent it go in the private source.
 */
export interface EntrySubmission {
  id: number;
  submitterRole: string;
  payload: Payload;
}

export function prefillFromSubmission(
  submission: EntrySubmission,
  sports: { id: string; slug: string }[],
  emptyBio: BioValue,
): { bio: BioValue; entry: EntryValue } {
  const { payload } = submission;
  const sportId =
    sports.find((sport) => sport.slug === payload.sportSlug)?.id ??
    sports[0]?.id ??
    "";
  const entry = emptyEntry(sportId, {
    schoolId: null,
    schoolName: payload.currentSchool,
    label: payload.currentSchool,
  });
  return {
    bio: {
      ...emptyBio,
      firstName: payload.playerFirstName,
      lastName: payload.playerLastName,
    },
    entry: {
      ...entry,
      // Only an "entered" report dates the entry; a commitment happened later.
      enteredAt:
        payload.move === "entered" && payload.happenedOn
          ? atNoon(payload.happenedOn)
          : entry.enteredAt,
      source: {
        ...EMPTY_SOURCE,
        sourceType: "submission",
        sourceUrl: payload.link ?? "",
        sourceNote: `Submission #${submission.id} from a ${submission.submitterRole}`,
      },
    },
  };
}
