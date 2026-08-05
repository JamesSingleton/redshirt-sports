import { SignUp } from "@redshirt-sports/auth/components/sign-up";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense>
      <SignUp />
    </Suspense>
  );
}
