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

function verifyParams(searchParams: URLSearchParams) {
  const email = searchParams.get("email");
  const expires = searchParams.get("expires");
  const sig = searchParams.get("sig");

  if (!email || !expires || !sig) {
    return {
      ok: false as const,
      response: htmlResponse(
        "Invalid link",
        "This unsubscribe link is invalid.",
        400,
      ),
    };
  }

  const result = verifySignature(email, "unsubscribe", expires, sig);
  if (!result.valid) {
    const message =
      result.reason === "expired"
        ? "This unsubscribe link has expired."
        : "This unsubscribe link is invalid.";
    return {
      ok: false as const,
      response: htmlResponse("Invalid link", message, 400),
    };
  }

  return { ok: true as const, email, expires, sig };
}

/**
 * GET shows a confirmation page with an unsubscribe button.
 * Link scanners / prefetch won't change anything.
 */
export async function GET(request: NextRequest) {
  if (!isNewsletterEnabled()) {
    return htmlResponse(
      "Unavailable",
      "Newsletter signup isn't available yet.",
      503,
    );
  }

  const check = verifyParams(request.nextUrl.searchParams);
  if (!check.ok) {
    return check.response;
  }

  const actionUrl = `${request.nextUrl.pathname}?${request.nextUrl.searchParams.toString()}`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Unsubscribe</title></head><body><h1>Unsubscribe</h1><p>Click the button below to unsubscribe from the Redshirt Sports newsletter.</p><form method="POST" action="${actionUrl}"><button type="submit">Unsubscribe</button></form></body></html>`;
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

/** POST actually updates the contact (button click or RFC 8058 one-click). */
export async function POST(request: NextRequest) {
  if (!isNewsletterEnabled()) {
    return htmlResponse(
      "Unavailable",
      "Newsletter signup isn't available yet.",
      503,
    );
  }

  const check = verifyParams(request.nextUrl.searchParams);
  if (!check.ok) {
    return check.response;
  }

  const resend = new Resend(env.RESEND_API_KEY);

  const { error } = await resend.contacts
    .update({
      email: check.email,
      audienceId: env.RESEND_NEWSLETTER_AUDIENCE_ID!,
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
