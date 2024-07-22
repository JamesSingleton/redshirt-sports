import Link from 'next/link'
import { formatDistance } from 'date-fns'

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { getLastThreePosts } from '@/lib/sanity.fetch'

export default async function RankingsLayout({ children }: { children: React.ReactNode }) {
  const lastThreePosts = await getLastThreePosts()
  return (
    <div className="container mx-auto flex flex-col space-x-0 py-8 md:flex-row md:space-x-8">
      <div className="flex-1">{children}</div>
      <aside className="mt-8 w-full md:mt-0 md:w-1/4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Latest NCAAF News</CardTitle>
          </CardHeader>
          <CardContent>
            {lastThreePosts.map((post) => (
              <Link href={`/${post.slug}`} key={post._id} className="group mb-4 block">
                <h4 className="font-bold group-hover:underline">{post.title}</h4>
                <p>{post.excerpt}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDistance(post.publishedAt, new Date(), { addSuffix: true })} -{' '}
                  {post.author.name}
                </p>
              </Link>
            ))}
          </CardContent>
          <CardFooter>
            <Link href="/news" className={buttonVariants({ variant: 'link' })}>
              All NCAAF News
            </Link>
          </CardFooter>
        </Card>
      </aside>
    </div>
  )
}
