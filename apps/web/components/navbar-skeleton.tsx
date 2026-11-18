import { NavbarSkeletonResponsive } from "@/components/navbar-client";

export function NavbarSkeleton() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95">
      <div className="mx-auto flex h-14 max-w-site items-center gap-3 px-4 lg:h-16 lg:px-6">
        <div className="bg-muted h-7 w-[169px] animate-pulse rounded" />
        <NavbarSkeletonResponsive />
      </div>
    </header>
  );
}
