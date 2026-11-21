/** What the signup endpoint answers; the form shows `message`. */
export type SignupState =
  | { status: "idle" }
  | { status: "sent" | "error"; message: string };

export const SIGNUP_SENT: SignupState = {
  status: "sent",
  message: "Check your inbox for a link to confirm your subscription.",
};

/** Where the confirm link lands: `/newsletter?status=<one of these>`. */
export const CONFIRM_MESSAGES = {
  confirmed: {
    status: "sent",
    message: "You're subscribed. Your first issue arrives Sunday morning.",
  },
  invalid: {
    status: "error",
    message:
      "That confirm link has expired. Sign up again and we'll send a new one.",
  },
  error: {
    status: "error",
    message:
      "We couldn't confirm that on our end. Try the link again in a few minutes.",
  },
} as const satisfies Record<string, SignupState>;

export type ConfirmStatus = keyof typeof CONFIRM_MESSAGES;

/** The message for a `?status=` value, or idle for anything else. */
export function confirmState(status: string | null): SignupState {
  return status !== null && Object.hasOwn(CONFIRM_MESSAGES, status)
    ? CONFIRM_MESSAGES[status as ConfirmStatus]
    : { status: "idle" };
}
