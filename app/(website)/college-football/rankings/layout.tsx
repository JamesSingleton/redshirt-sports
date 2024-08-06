import Link from 'next/link'
import { formatDistance } from 'date-fns'

import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { getLastThreePosts } from '@/lib/sanity.fetch'

export default async function RankingsLayout({ children }: { children: React.ReactNode }) {
  const lastThreePosts = await getLastThreePosts()
  return (
    <div className="container mx-auto flex flex-col space-x-0 py-8 lg:flex-row lg:space-x-8">
      <div className="flex-1">{children}</div>
      <aside className="mt-8 w-full lg:mt-0 lg:w-1/4">
        <Card className="w-full">
          <CardHeader>
            <h2 className="text-2xl font-semibold leading-none tracking-tight">
              Latest NCAAF News
            </h2>
          </CardHeader>
          <CardContent>
            {lastThreePosts.map((post) => (
              <Link href={`/${post.slug}`} key={post._id} className="group mb-4 block">
                <h3 className="font-bold group-hover:underline">{post.title}</h3>
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
