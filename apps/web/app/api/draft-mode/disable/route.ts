import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

export async function GET() {
  const draft = await draftMode();
  if (draft.isEnabled) {
    draft.disable();
  }
  redirect("/");
}
