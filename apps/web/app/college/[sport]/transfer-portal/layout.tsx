import { StreamedRoute } from "@/components/streamed-route";

export default function TransferPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StreamedRoute>
      <div className="mx-auto w-full min-w-0 max-w-site px-4 pb-12 lg:px-6">
        {children}
      </div>
    </StreamedRoute>
  );
}
