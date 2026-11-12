import type { NextRequest } from "next/server";
import { Resend } from "resend";

import { env } from "@/env";
import { verifySignature } from "@/lib/newsletter";

const resend = new Resend(env.RESEND_API_KEY);

function htmlResponse(heading: string, message: string, status: number) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${heading}</title></head><body><h1>${heading}</h1><p>${message}</p></body></html>`;
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

async function handleUnsubscribe(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const email = searchParams.get("email");
  const expires = searchParams.get("expires");
  const sig = searchParams.get("sig");

  if (!email || !expires || !sig) {
    return htmlResponse(
      "Invalid link",
      "This unsubscribe link is invalid.",
      400,
    );
  }

  const result = verifySignature(email, "unsubscribe", expires, sig);
  if (!result.valid) {
    const message =
      result.reason === "expired"
        ? "This unsubscribe link has expired."
        : "This unsubscribe link is invalid.";
    return htmlResponse("Invalid link", message, 400);
  }

  const { error } = await resend.contacts
    .update({
      email,
      audienceId: env.RESEND_NEWSLETTER_AUDIENCE_ID,
      unsubscribed: true,
    })
    .catch((cause: unknown) => ({ error: cause }));
  if (error) {
    return htmlResponse(
      "Something went wrong",
      "We couldn't process your unsubscribe request. Please try again later.",
      500,
    );
  }

  return htmlResponse(
    "Unsubscribed",
    "You've been unsubscribed from the Redshirt Sports newsletter.",
    200,
  );
}

export async function GET(request: NextRequest) {
  return handleUnsubscribe(request);
}

export async function POST(request: NextRequest) {
  return handleUnsubscribe(request);
}
