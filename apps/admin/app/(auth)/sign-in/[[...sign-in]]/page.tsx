import { SignIn } from "@redshirt-sports/auth/components/sign-in";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense>
      <SignIn />
    </Suspense>
  );
}
