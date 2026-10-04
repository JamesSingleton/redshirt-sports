import { Skeleton } from "@redshirt-sports/ui/components/skeleton";

import {
  MEGABOARD_SIDE_BODY_CLASS,
  MEGABOARD_SIDE_CARD_CLASS,
  MEGABOARD_SIDE_IMAGE_CLASS,
  MEGABOARD_SIDE_ITEM_CLASS,
  MEGABOARD_SIDE_LIST_CLASS,
} from "@/components/home/megaboard";
import { Top25CardSkeleton } from "@/components/rankings/top25-card";

function CardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-video w-full rounded-md" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-4/5" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

function ThumbRowSkeleton() {
  return (
    <div className={MEGABOARD_SIDE_CARD_CLASS}>
      <Skeleton className={MEGABOARD_SIDE_IMAGE_CLASS} />
      <div className={MEGABOARD_SIDE_BODY_CLASS}>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

function SectionHeaderSkeleton() {
  return (
    <div className="flex items-end justify-between border-b pb-3">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

function SidebarCardSkeleton() {
  return (
    <div className="bg-card overflow-hidden rounded-md border">
      <div className="border-brand border-l-4 px-4 py-3">
        <Skeleton className="h-6 w-28" />
      </div>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex items-center gap-3 border-t px-4 py-3">
          <Skeleton className="size-11 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePageSkeleton() {
  return (
    <div aria-busy="true" className="container flex flex-col gap-8 py-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="aspect-4/3 w-full rounded-md sm:aspect-video lg:col-span-2" />
        <div className={MEGABOARD_SIDE_LIST_CLASS}>
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className={MEGABOARD_SIDE_ITEM_CLASS}>
              <ThumbRowSkeleton />
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-10 lg:col-span-8">
          {Array.from({ length: 2 }, (_, section) => (
            <div key={section} className="flex flex-col gap-6">
              <SectionHeaderSkeleton />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {Array.from({ length: 4 }, (_, index) => (
                  <CardSkeleton key={index} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-6 lg:col-span-4">
          <Top25CardSkeleton />
          <SidebarCardSkeleton />
        </div>
      </div>
    </div>
  );
}
