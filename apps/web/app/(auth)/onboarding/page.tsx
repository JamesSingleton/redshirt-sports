import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { Suspense } from "react";

import Onboarding from "@/components/forms/onboarding";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Onboarding",
  robots: noIndexRobots,
};

export default async function OnboardingPage() {
  await auth.protect();

  return (
    <div className="container flex items-center justify-center">
      <Suspense fallback={<div>Loading...</div>}>
        <Onboarding />
      </Suspense>
    </div>
  );
}
