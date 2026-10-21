import { SanityLive } from "@redshirt-sports/sanity/live";
import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";

import { DisableDraftMode } from "@/components/disable-draft-mode";
import { CachedFooterServer } from "@/components/footer";
import { CachedCombinedJsonLd } from "@/components/json-ld";
import { CachedNavbarServer } from "@/components/navbar";
import { resolveDynamicFetchOptions } from "@/lib/resolve-dynamic-fetch-options";

export async function DraftAwareNavbar() {
  const options = await resolveDynamicFetchOptions();
  return <CachedNavbarServer {...options} />;
}

export async function DraftAwareFooter() {
  const options = await resolveDynamicFetchOptions();
  return <CachedFooterServer {...options} />;
}

export async function DraftAwareJsonLd() {
  const options = await resolveDynamicFetchOptions();
  return <CachedCombinedJsonLd {...options} />;
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
