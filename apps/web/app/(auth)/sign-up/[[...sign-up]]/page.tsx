import { SignUp } from "@redshirt-sports/auth/components/sign-up";
import type { Metadata } from "next";
import { Suspense } from "react";

import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a Redshirt Sports account.",
  robots: noIndexRobots,
};

export default function SignUpPage() {
  return (
    <div className="flex justify-center py-24">
      <Suspense>
        <SignUp />
      </Suspense>
    </div>
  );
}
