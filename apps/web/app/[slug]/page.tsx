import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CameraIcon } from 'lucide-react'
import { badgeVariants } from '@workspace/ui/components/badge'

import { sanityFetch } from '@/lib/sanity/live'
import { queryPostSlugData } from '@/lib/sanity/query'
import Date from '@/components/date'
import { AuthorSection, MobileAuthorSection } from '@/components/posts/author'
import { Image } from '@/components/image'
import { RichText } from '@/components/rich-text'
import { LargeArticleSocialShare } from '@/components/posts/article-share'
import CustomImage from '@/components/sanity-image'

import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

async function fetchPostSlugData(slug: string) {
  return await sanityFetch({
    query: queryPostSlugData,
    params: { slug }
  })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata>{
  const { slug } = await params
  const { data: pageData } = await fetchPostSlugData(slug)

  if (!pageData) {
    return {}
  }

  return {
    title: `${pageData.title} | ${process.env.NEXT_PUBLIC_APP_NAME}`,
    description: pageData.excerpt,
  }
}

export default async function PostPage({params}: PageProps) {
  const { slug } = await params
  const { data } = await fetchPostSlugData(slug)

  if(!data) {
    notFound()
  }

  return (
    <>
      <section className="pb-8 mt-8">
        <div className="container">
          <h1 id="article-title" className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
              {data.title}
          </h1>
          <p id="article-excerpt" className="mt-4 text-lg font-normal lg:text-xl">
            {data.excerpt}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {(data.division || data.conferences) && (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    {data.division && (
                      <Link
                        href={`/news/${data.division.slug}`}
                        className={badgeVariants({ variant: 'default' })}
                        prefetch={false}
                      >
                        {data.division.name}
                      </Link>
                    )}
                    {data.conferences &&
                      data.conferences.map((conference: {
                        shortName: string
                        name: string
                        slug: string
                      }) => (
                        <Link
                          key={conference.slug}
                          href={`/news/${data.division.slug}/${conference.slug}`}
                          className={badgeVariants({ variant: 'default' })}
                          prefetch={false}
                        >
                          {conference.shortName ?? conference.name}
                        </Link>
                      ))}
                  </div>
                  <span className="text-sm">•</span>
                </>
              )}
              <Date dateString={data.publishedAt} className="text-sm" />
          </div>
        </div>
      </section>
      <section className="pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
        <div className="container">
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-20 xl:gap-24">
            <div className="lg:w-64 lg:shrink-0">
              <div className="hidden lg:sticky lg:left-0 lg:top-24 lg:flex lg:flex-col lg:items-stretch lg:justify-start lg:gap-4 lg:self-start">
                <AuthorSection author={data.author} authors={data.authors} />
                <LargeArticleSocialShare slug={data.slug} title={data.title} />
              </div>
              <MobileAuthorSection author={data.author} authors={data.authors} />
            </div>
            <article className="max-w-full space-y-8 lg:flex-1 lg:space-y-12">
              <figure className="mb-8 space-y-1.5">
                <CustomImage 
                  image={data.mainImage}
                  width={1600}
                  height={900}
                  className="rounded-lg h-auto w-full"
                  loading="eager"
                />
                <figcaption className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CameraIcon className="h-4 w-4" />
                  <span>
                    Source: {data.mainImage.credit}
                  </span>
                </figcaption>
              </figure>
              <RichText richText={data.body} />
            </article>
          </div>
        </div>
      </section>
    </>
  )
}