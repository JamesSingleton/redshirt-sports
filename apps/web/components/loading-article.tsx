import { Skeleton } from '@redshirt-sports/ui/components/skeleton'
import { Separator } from '@redshirt-sports/ui/components/separator'

export function LoadingArticle() {
  return (
    <div className="overflow-hidden rounded-lg shadow-lg">
      <div className="bg-muted flex h-48 w-full items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="bg-background p-4">
        <div className="mb-2 flex items-center space-x-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-8 w-full" />
        <div className="flex items-center space-x-2 pt-4">
          <Skeleton className="h-4 w-24" />
          <Separator orientation="vertical" className="h-4" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  )
}
