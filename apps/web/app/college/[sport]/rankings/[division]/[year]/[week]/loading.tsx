import {
  Card,
  CardContent,
  CardHeader,
} from "@redshirt-sports/ui/components/card";

export default function RankingsLoading() {
  return (
    <div className="container mx-auto gap-8 px-4 py-8">
      <Card>
        <CardHeader>
          <div className="bg-muted h-8 w-3/4 max-w-xl animate-pulse rounded" />
          <div className="bg-muted mt-2 h-4 w-full max-w-2xl animate-pulse rounded" />
          <div className="flex gap-4 pt-4">
            <div className="bg-muted h-10 w-32 animate-pulse rounded" />
            <div className="bg-muted h-10 w-32 animate-pulse rounded" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 10 }, (_, index) => (
              <div
                key={`rankings-row-skeleton-${index}`}
                className="bg-muted h-12 animate-pulse rounded"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
