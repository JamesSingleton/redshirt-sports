import { SanityLive } from "@redshirt-sports/sanity/live";
import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";

import { DisableDraftMode } from "@/components/disable-draft-mode";
import { CachedFooterServer, DynamicFooterServer } from "@/components/footer";
import {
  CachedCombinedJsonLd,
  DynamicCombinedJsonLd,
} from "@/components/json-ld";
import { CachedNavbarServer, DynamicNavbarServer } from "@/components/navbar";

export async function DraftAwareNavbar() {
  const isDraftMode = (await draftMode()).isEnabled;
  if (isDraftMode) {
    return <DynamicNavbarServer />;
  }
  return <CachedNavbarServer perspective="published" stega={false} />;
}

export async function DraftAwareFooter() {
  const isDraftMode = (await draftMode()).isEnabled;
  if (isDraftMode) {
    return <DynamicFooterServer />;
  }
  return <CachedFooterServer perspective="published" stega={false} />;
}

export async function DraftAwareJsonLd() {
  const isDraftMode = (await draftMode()).isEnabled;
  if (isDraftMode) {
    return <DynamicCombinedJsonLd />;
  }
  return <CachedCombinedJsonLd perspective="published" stega={false} />;
}

export async function DraftAwareLiveAndEditing() {
  const isDraftMode = (await draftMode()).isEnabled;
  return (
    <>
      <SanityLive
        includeDrafts={isDraftMode}
        waitFor={
          process.env.VERCEL_ENV === "production" ? "function" : undefined
        }
      />
      {isDraftMode ? (
        <>
          <VisualEditing />
          <DisableDraftMode />
        </>
      ) : null}
    </>
  );
}
