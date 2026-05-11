import * as Sentry from "@sentry/nextjs";

export const parseError = (error: unknown): string => {
  let message = "An error occurred";

  if (error instanceof Error) {
    message = error.message;
  } else if (error && typeof error === "object" && "message" in error) {
    message = error.message as string;
  } else {
    message = String(error);
  }

  try {
    Sentry.captureException(error);
  } catch (newError) {
    console.error("Error parsing error:", newError);
  }

  return message;
};
