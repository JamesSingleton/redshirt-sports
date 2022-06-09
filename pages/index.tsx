import Link from 'next/link'
import { NextSeo } from 'next-seo'

import Layout from '@components/common/Layout/Layout'
import { getClient } from '@lib/sanity.server'
import { homePageQuery } from '@lib/queries'
import BlogCard from '@components/ui/BlogCard'
import BlurImage from '@components/ui/BlurImage'
import { urlForImage } from '@lib/sanity'
import Date from '@components/ui/Date'
import { SITE_URL } from '@lib/constants'

import type { GetStaticProps } from 'next'
import type { Post } from '@types'

interface HomePageProps {
  heroPost: Post
  latestPosts: Post[]
  featuredArticle: Post
}

export default function Home({
  heroPost,
  latestPosts,
  featuredArticle,
}: HomePageProps) {
  return (
    <>
      <NextSeo canonical={SITE_URL} />
      <Layout>
        <div className="mb-20 w-full">
          {heroPost !== undefined ? (
            <div className="mx-auto w-full max-w-screen-xl md:mb-28 lg:w-5/6">
              <Link href={`/${heroPost.slug}`}>
                <a>
                  <div className="group relative mx-auto h-80 w-full overflow-hidden sm:h-150 lg:rounded-xl">
                    {heroPost.mainImage ? (
                      <BlurImage
                        alt={heroPost.title ?? ''}
                        blurDataURL={
                          heroPost.mainImage.asset.metadata.lqip ?? undefined
                        }
                        className="group-hover:scale-105 group-hover:duration-300"
                        layout="fill"
                        objectFit="cover"
                        placeholder="blur"
                        src={urlForImage(heroPost.mainImage)
                          .width(1280)
                          .height(600)
                          .url()}
                      />
                    ) : (
                      <div className="absolute flex h-full w-full select-none items-center justify-center bg-gray-100 text-4xl text-gray-500">
                        ?
                      </div>
                    )}
                  </div>
                  <div className="mx-auto mt-10 w-5/6 lg:w-full">
                    <h1 className="my-10 font-cal text-4xl md:text-6xl">
                      {heroPost.title}
                    </h1>
                    <p className="w-full text-base md:text-lg lg:w-2/3">
                      {heroPost.excerpt}
                    </p>
                    <div className="flex w-full items-center justify-start space-x-4">
                      <div className="relative h-8 w-8 flex-none overflow-hidden rounded-full">
                        {heroPost.author?.image ? (
                          <BlurImage
                            alt={heroPost.author?.name ?? 'User Avatar'}
                            layout="fill"
                            objectFit="cover"
                            src={urlForImage(heroPost.author?.image).url()}
                          />
                        ) : (
                          <div className="absolute flex h-full w-full select-none items-center justify-center bg-slate-100 text-4xl">
                            ?
                          </div>
                        )}
                      </div>
                      <p className="ml-3 inline-block whitespace-nowrap align-middle text-sm font-semibold md:text-base">
                        {heroPost.author?.name}
                      </p>
                      <div className="h-6 border-l border-slate-900 dark:border-slate-200" />
                      <p className="m-auto my-5 w-10/12 text-sm font-light md:text-base">
                        <Date dateString={heroPost.publishedAt.toString()} />
                      </p>
                    </div>
                  </div>
                </a>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <BlurImage
                src="/images/empty-state.png"
                alt="No Posts"
                width={613}
                height={420}
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAA6ZJREFUWEe1VwFuGzEMk2///+8uydmDSFGWfdduKLAUQYqsiyiKpJQ2xhj2t4f/RR82RreO18FX/xlm+oDWzKw1a63Z4c+Dz3YcX1ZoPwLQh/VBIF48O2he/78BiO57R3ECMIDAw7s3L27WvGswcCQT+IeHx78x4HR7Ye9cIygM5Oc+MnBgDD8HkDPvNgJAHz27XwRUAfj8G4tTBxDIjYPvGfAuUfSJfo7AH/4SE5gaQOE5Av/9iYWvAWzFvWvQXwVYDQTxFRF68dTCBLODeAYQImPnon7VgBxQOYUDQL1e5wj4njNCq2ocNwD4YPicxSm8+bsYcP7r/GW/BFE0IFBiBH8D0zQrADhTCKzM3YtfVQMhSrIf03fq/adSro4XRmhPPsO93av5R8lWpTgLx/Ny788k9No1ATOAQnjoOoTITFiL+3sg4epXhiE9ziIofrE4fycAx0uwMX11X4pA/bJfWHGCCOojvdr780EvSrU6dy98BYj5PgEU82X2q4gAZBo+da8RvN7vGwBR78UnEyHGGJX4l6Co8Ek7KQ8rSgfwqawaGjhfr0UDolydJ4gtimU/iK/ZLXS0BaclqQFuS7oQ//d8nWAUqzWiFtRj7hdGMEeh+U8DEkB0rgWkFIxVLBC5rmVBx/H7PJMBbLlQPQqX4hqLRFgZyC4lvtwBcwQ1J9h9iHEBgJjdCl8XnQAxcg0jhAY/5L7/vahccCzJmP6XBR3IIwOl8w8KcxRax0rBnwEIIYqB83whVNnYzACOYNeAr+Gwoe6Q5QKanSuEMoA2K4YKXYTFBQqgEGHqwIFEQtYg0gqGBm4CLIvoONYIzihu1pADxQV7BogJ2pNOSRZ4hH3jgpIDhQFYMc44JmHcdtqCsl3aT4GkpRRC1DGIHCjXD0Wo4gyouqaVAXi9PheDdVnDg/MP9e9xXBnQIYoUbKH64oJcSCUN5/lu1rrzGgCYA3sWEIgvJn/d7wGMwEdRL+ESRIslyyrObYhVuIyAAOoikhjzQsptyHsg7agVjHEcdvyqdyHZURbkDsldHCBuDJTusZ5xK8ZVHBtJQty3Ye1+2Q2xkKDD5ZuRg4gRLG74diXrC0lxQ45gzYX9MLkD8He6zSNEEby7YLOibDVvv1p4i+UaSDcG4sxzFpaLSJfRPoJylueyKafYPgJ9T6g74fEsH85CLbpdRvp2LPekosNqa+FtDPE3ukqfvxdoDBuIeq4td2Gc+uxsjeB0Q1nRPEx4lPwBA2anSbfNT08AAAAASUVORK5CYII="
              />
              <p className="font-cal text-2xl">No posts yet.</p>
            </div>
          )}
        </div>
        {latestPosts.length > 1 && (
          <div className="mx-5 mb-20 max-w-screen-xl lg:mx-24 2xl:mx-auto">
            <h2 className="mb-10 font-cal text-4xl md:text-5xl">
              More stories
            </h2>
            <div className="grid w-full grid-cols-1 gap-x-4 gap-y-8 md:grid-cols-2 xl:grid-cols-3">
              {latestPosts.map((metadata, index) => (
                <BlogCard key={index} data={metadata} />
              ))}
            </div>
          </div>
        )}
      </Layout>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const { heroPost, featuredArticle, latestPosts } = await getClient().fetch(
    homePageQuery
  )

  return {
    props: {
      heroPost,
      latestPosts,
      featuredArticle,
    },
  }
}
