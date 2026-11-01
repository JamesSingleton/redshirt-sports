"use server";
import { analytics } from "@redshirt-sports/analytics/server";
import { auth, clerkClient } from "@redshirt-sports/auth/server";

import { onboardingSchema } from "@/lib/schemas/onboarding";

export const completeOnboarding = async (formData: FormData) => {
  const { userId } = await auth();

  if (!userId) {
    return { error: "No Logged In User" };
  }

  // The form posts natively, so client-side validation isn't guaranteed.
  const parsed = onboardingSchema.safeParse({
    organizationName: formData.get("organizationName"),
    organizationRole: formData.get("organizationRole"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]!.message };
  }
  const { organizationName, organizationRole } = parsed.data;

  try {
    const client = await clerkClient();

    // Organization shows on public voter lists; after onboarding only admins
    // change it (via Clerk), so this action can't be replayed to rename.
    const existing = await client.users.getUser(userId);
    if (existing.publicMetadata.onboardingComplete === true) {
      return { error: "Onboarding is already complete" };
    }

    const res = await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        onboardingComplete: true,
        organization: organizationName,
        organizationRole,
      },
    });

    // Capture onboarding_completed event with PostHog
    analytics?.capture({
      distinctId: userId,
      event: "onboarding_completed",
      properties: {
        organization: organizationName,
        organization_role: organizationRole,
      },
    });

    return { message: res.publicMetadata };
  } catch (error) {
    console.error("completeOnboarding failed:", error);
    return { error: "There was an error updating your user." };
  }
};
