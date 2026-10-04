import { SignIn } from "@redshirt-sports/auth/components/sign-in";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sign In",
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
    <div className="container flex justify-center py-12 md:py-20">
      <Suspense>
        <SignIn />
      </Suspense>
    </div>
  );
}
