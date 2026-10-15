import { SignIn } from "@redshirt-sports/auth/components/sign-in";
import { Suspense } from "react";

export default function VoteSignInPage() {
  return (
    <main className="mx-auto flex max-w-md justify-center px-6 py-16">
      <Suspense>
        <SignIn />
      </Suspense>
    </main>
  );
}
