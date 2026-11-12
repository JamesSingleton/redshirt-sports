import type { NextRequest } from "next/server";
import { Resend } from "resend";

import { env } from "@/env";
import { isNewsletterEnabled, verifySignature } from "@/lib/newsletter";

function htmlResponse(heading: string, message: string, status: number) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${heading}</title></head><body><h1>${heading}</h1><p>${message}</p></body></html>`;
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(request: NextRequest) {
  if (!isNewsletterEnabled()) {
    return htmlResponse(
      "Unavailable",
      "Newsletter signup isn't available yet.",
      503,
    );
  }

  const { searchParams } = request.nextUrl;
  const email = searchParams.get("email");
  const expires = searchParams.get("expires");
  const sig = searchParams.get("sig");

  if (!email || !expires || !sig) {
    return htmlResponse(
      "Invalid link",
      "This confirmation link is invalid.",
      400,
    );
  }

  const result = verifySignature(email, "confirm", expires, sig);
  if (!result.valid) {
    const message =
      result.reason === "expired"
        ? "This confirmation link has expired. Please subscribe again."
        : "This confirmation link is invalid.";
    return htmlResponse("Invalid link", message, 400);
  }

  const resend = new Resend(env.RESEND_API_KEY);

  const { error } = await resend.contacts
    .update({
      email,
      audienceId: env.RESEND_NEWSLETTER_AUDIENCE_ID!,
      unsubscribed: false,
    })
    .catch((cause: unknown) => ({ error: cause }));
  if (error) {
    return htmlResponse(
      "Something went wrong",
      "We couldn't confirm your subscription. Please try again later.",
      500,
    );
  }

  return htmlResponse(
    "Subscription confirmed",
    "You're now subscribed to the Redshirt Sports newsletter.",
    200,
  );
}
