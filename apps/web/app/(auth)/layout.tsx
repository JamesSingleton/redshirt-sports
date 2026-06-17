import { AuthProvider } from "@redshirt-sports/auth/provider";
import { Suspense } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <AuthProvider>{children}</AuthProvider>
    </Suspense>
  );
}
