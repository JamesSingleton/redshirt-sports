import { z } from "zod";

const MAX_FIELD_LENGTH = 100;

/** Organization details collected at onboarding. Used by the form and the server action. */
export const onboardingSchema = z.object({
  organizationName: z
    .string()
    .trim()
    .min(2, { error: "Organization Name must be at least 2 characters" })
    .max(MAX_FIELD_LENGTH, {
      error: `Organization Name must be at most ${MAX_FIELD_LENGTH} characters`,
    }),
  organizationRole: z
    .string()
    .trim()
    .min(2, { error: "Organization Role must be at least 2 characters" })
    .max(MAX_FIELD_LENGTH, {
      error: `Organization Role must be at most ${MAX_FIELD_LENGTH} characters`,
    }),
});

export type OnboardingValues = z.infer<typeof onboardingSchema>;
