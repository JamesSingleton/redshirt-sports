import { SignIn } from "@clerk/nextjs";
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

export default function Page() {
  return (
    <div className="flex justify-center py-24">
      <Suspense>
        <SignIn />
      </Suspense>
    </div>
  );
}
