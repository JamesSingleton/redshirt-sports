import Link from "next/link";
import { buttonVariants } from "@workspace/ui/components/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-400px)] flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-6xl font-bold text-foreground animate-bounce">404</h1>
      <p className="text-lg text-muted-foreground animate-fade-in">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        aria-label="Return Home"
        className={buttonVariants()}
      >
        Return Home
      </Link>
    </div>
  );
}