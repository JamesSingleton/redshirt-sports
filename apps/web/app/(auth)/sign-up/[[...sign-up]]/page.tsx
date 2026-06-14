import { SignUp } from "@redshirt-sports/auth/components/sign-up";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sign Up | Redshirt Sports",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
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
