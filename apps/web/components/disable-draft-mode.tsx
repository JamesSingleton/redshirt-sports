"use client";
import { useIsPresentationTool } from "next-sanity/hooks";
export function DisableDraftMode() {
  const isPresentationTool = useIsPresentationTool();
  // Hide the button when inside the Presentation Tool
  if (isPresentationTool) return null;
  return (
    <a
      href="/api/draft-mode/disable"
      className="fixed bottom-4 right-4 z-50 rounded-full bg-gray-900 px-4 py-2 text-sm text-white"
    >
      Disable Draft Mode
    </a>
  );
}
