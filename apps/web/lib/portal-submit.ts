// Shared by the "report a move" form and its server action. A "use server"
// file can only export async functions, so these live here.

/** The fields the form posts, by input name. */
export const SUBMIT_FIELDS = [
  "submitterRole",
  "submitterName",
  "submitterEmail",
  "playerFirstName",
  "playerLastName",
  "sportSlug",
  "position",
  "currentSchool",
  "move",
  "destinationSchool",
  "happenedOn",
  "link",
  "note",
] as const;
export type SubmitField = (typeof SUBMIT_FIELDS)[number];

export interface SubmitState {
  status: "idle" | "sent" | "error";
  /** A message for the whole form: thanks, or why it didn't go through. */
  message?: string;
  /** One message per field that needs fixing. */
  errors?: Partial<Record<SubmitField, string>>;
  /** What they typed, so a failed submit doesn't empty the form. */
  values?: Partial<Record<SubmitField, string>>;
}
