import { Spinner } from "@redshirt-sports/ui/components/spinner";
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
    <div className="container flex justify-center py-12 md:py-20">
      <Suspense fallback={<Spinner className="size-6" />}>
        <Onboarding />
      </Suspense>
    </div>
  );
}
