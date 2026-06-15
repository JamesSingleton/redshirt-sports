import { SignIn } from "@redshirt-sports/auth/components/sign-in";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sign In | Redshirt Sports",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
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
