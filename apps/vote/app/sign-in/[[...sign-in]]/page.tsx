import { SignIn } from "@redshirt-sports/auth/components/sign-in";
import { Suspense } from "react";

export default function Page() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <Suspense>
        <SignIn />
      </Suspense>
    </main>
  );
}
