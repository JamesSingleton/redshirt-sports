import type { WebhookEvent } from "@clerk/nextjs/server";
import { analytics } from "@redshirt-sports/analytics/server";
import {
  createUser,
  revokeAssignmentsForNonVoters,
  updateUser,
} from "@redshirt-sports/db/queries";
import { headers } from "next/headers";
import { Webhook } from "svix";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local",
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

  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  const { type, data } = evt;

  try {
    switch (type) {
      case "user.created":
        await createUser({
          id: data.id,
          firstName: data.first_name ?? "",
          lastName: data.last_name ?? "",
        });

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
      case "user.updated": {
        const isVoter = Boolean(data.public_metadata.isVoter);

        await updateUser({
          id: data.id,
          firstName: data.first_name ?? "",
          lastName: data.last_name ?? "",
          organization: data.public_metadata.organization as string | undefined,
          organizationRole: data.public_metadata.organizationRole as
            | string
            | undefined,
          isAdmin: data.public_metadata.isAdmin as boolean | undefined,
          isVoter,
        });

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
      default:
        return new Response("", { status: 501 });
    }
    return new Response("", { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(message, { status: 500 });
  }
}
