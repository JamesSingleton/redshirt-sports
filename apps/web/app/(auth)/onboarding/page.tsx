import type { Metadata } from "next";
import { Suspense } from "react";

import Onboarding from "@/components/forms/onboarding";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Onboarding",
  robots: noIndexRobots,
};

export default async function OnboardingPage() {
  return (
    <div className="container flex items-center justify-center">
      <Suspense fallback={<div>Loading...</div>}>
        <Onboarding />
      </Suspense>
    </div>
  );
}
