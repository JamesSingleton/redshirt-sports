import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@redshirt-sports/ui/components/card";
import Link from "next/link";

export function MoreFromAuthorCard({
  authorName,
  posts,
}: {
  authorName: string;
  posts: Array<{ _id: string; title: string; slug: string }>;
}) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <Card className="gap-0 shadow-xs">
      <CardHeader className="px-5 pt-5">
        <CardTitle className="font-display text-xl font-bold uppercase leading-none tracking-wide">
          More from {authorName}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {posts.map((post) => (
          <Link
            key={post._id}
            href={`/${post.slug}`}
            className="block border-b py-2.5 text-sm font-semibold last:border-0 hover:underline"
            prefetch={false}
          >
            {post.title}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
