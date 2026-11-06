import { AuthProvider } from "@redshirt-sports/auth/provider";

import { AuthAnalytics } from "@/components/analytics/auth-analytics";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AuthAnalytics />
      {children}
    </AuthProvider>
  );
}
