import { SignUp } from "@redshirt-sports/auth/components/sign-up";
import { Suspense } from "react";

export default function Page() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <Suspense>
        <SignUp />
      </Suspense>
    </main>
  );
}
