import { Suspense } from "react";

import { getStaff } from "@/actions/staff";
import { StaffManager } from "@/components/staff-manager";

function StaffFallback() {
  return (
    <div className="flex flex-col gap-6 p-6" aria-busy>
      <div className="bg-muted h-9 w-40 animate-pulse rounded" />
      <div className="bg-muted h-64 w-full animate-pulse rounded-xl" />
    </div>
  );
}

async function StaffContent() {
  const { me, staff } = await getStaff();
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Staff</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Who can use the admin, and which parts. Voting is separate: manage
          voters on Voting panels.
        </p>
      </div>
      <StaffManager me={me} staff={staff} />
    </div>
  );
}

export default function StaffPage() {
  return (
    <Suspense fallback={<StaffFallback />}>
      <StaffContent />
    </Suspense>
  );
}
