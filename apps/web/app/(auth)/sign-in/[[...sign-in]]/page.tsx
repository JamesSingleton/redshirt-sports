import { SignIn } from "@redshirt-sports/auth/components/sign-in";
import type { Metadata } from "next";
import { Suspense } from "react";

import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to Redshirt Sports.",
  robots: noIndexRobots,
};

export default function Page() {
  return (
    <div className="flex justify-center py-24">
      <Suspense>
        <SignIn />
      </Suspense>
    </div>
  );
}
