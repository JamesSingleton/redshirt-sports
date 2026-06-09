import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@redshirt-sports/ui/components/card";

export function VoterBreakdownSkeleton() {
  return (
    <div className="mt-8">
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="bg-muted h-7 w-48 animate-pulse rounded" />
          </CardTitle>
          <CardDescription>
            <div className="bg-muted h-4 w-full max-w-lg animate-pulse rounded" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted mb-4 h-10 w-full max-w-sm animate-pulse rounded" />
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={`voter-skeleton-${index}`}
                className="bg-muted h-12 animate-pulse rounded"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
