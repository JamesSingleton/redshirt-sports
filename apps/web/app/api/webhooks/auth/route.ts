import { analytics } from "@redshirt-sports/analytics/server";
import type { WebhookEvent } from "@redshirt-sports/auth/server";
import {
  createUser,
  deactivateUser,
  getUserDisplayFields,
  revokeAssignmentsForNonVoters,
  updateUser,
} from "@redshirt-sports/db/queries";
import * as Sentry from "@sentry/nextjs";
import { headers } from "next/headers";
import { Webhook } from "svix";

import { env } from "@/env";
import {
  expireRankingsCache,
  rankingsVoterDisplayChanged,
} from "@/lib/expire-rankings-cache";

function optionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function optionalBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

/** Postgres-facing fields from a Clerk user payload's names and public metadata. */
function clerkUserFields(data: {
  first_name: string | null;
  last_name: string | null;
  public_metadata?: Record<string, unknown>;
}) {
  const metadata = data.public_metadata ?? {};
  return {
    firstName: data.first_name ?? "",
    lastName: data.last_name ?? "",
    organization: optionalString(metadata.organization),
    organizationRole: optionalString(metadata.organizationRole),
    isAdmin: optionalBoolean(metadata.isAdmin),
    isVoter: metadata.isVoter === true,
  };
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local",
    );
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Svix signs the exact bytes sent, so verify the raw body (not re-serialized JSON).
  const body = await req.text();

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  // Verify the payload with the headers (svix v2 verifies in place; does not return the event)
  try {
    wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  const evt = JSON.parse(body) as WebhookEvent;

  try {
    switch (evt.type) {
      case "user.created": {
        const { data } = evt;
        await createUser({ id: data.id, ...clerkUserFields(data) });

        // Capture user_created event and identify user in PostHog
        analytics?.capture({
          distinctId: data.id,
          event: "user_created",
          properties: {
            source: "clerk_webhook",
          },
        });
        analytics?.identify({
          distinctId: data.id,
          properties: {
            first_name: data.first_name,
            last_name: data.last_name,
            created_at: new Date().toISOString(),
          },
        });
        break;
      }
      case "user.updated": {
        const { data } = evt;
        const { isVoter, isAdmin, ...nextDisplay } = clerkUserFields(data);
        const currentDisplay = await getUserDisplayFields(data.id);
        const displayChanged = rankingsVoterDisplayChanged(
          currentDisplay,
          nextDisplay,
        );

        await updateUser({
          id: data.id,
          ...nextDisplay,
          isAdmin,
          isVoter,
        });

        if (displayChanged) {
          expireRankingsCache();
        }

        // Drop active poll assignments when voter credentials are removed.
        // Historical ballots remain.
        if (!isVoter) {
          await revokeAssignmentsForNonVoters(data.id);
        }

        // Capture user_updated event in PostHog
        analytics?.capture({
          distinctId: data.id,
          event: "user_updated",
          properties: {
            source: "clerk_webhook",
            is_admin: data.public_metadata.isAdmin,
            is_voter: data.public_metadata.isVoter,
            organization: data.public_metadata.organization,
          },
        });
        analytics?.identify({
          distinctId: data.id,
          properties: {
            first_name: data.first_name,
            last_name: data.last_name,
            organization: data.public_metadata.organization,
            organization_role: data.public_metadata.organizationRole,
            is_admin: data.public_metadata.isAdmin,
            is_voter: data.public_metadata.isVoter,
          },
        });
        break;
      }
      case "user.deleted": {
        const { id } = evt.data;
        if (id) {
          await deactivateUser(id);
          await revokeAssignmentsForNonVoters(id);
        }
        break;
      }
      default:
        // Acknowledge events we don't handle so Svix doesn't retry them.
        break;
    }
    return new Response("", { status: 200 });
  } catch (error: unknown) {
    Sentry.captureException(error);
    console.error("Clerk webhook handler failed:", error);
    return new Response("Webhook handler failed", { status: 500 });
  }
}
