export const runtime = 'edge'

import { ImageResponse } from 'next/og'
import { notFound } from 'next/navigation'
import { getOpenGraphDataBySlug } from '@lib/sanity.fetch'
import { urlForImage } from '@lib/sanity.image'

export default async function ArticleOGImage({ params: { slug } }: { params: { slug: string } }) {
  const article = await getOpenGraphDataBySlug(slug)
  if (!article) {
    notFound()
  }

  return new ImageResponse(
    (
      <div tw="relative flex flex-col bg-[#DC2727] w-[1200px] h-[630px] px-8 text-white justify-center">
        <h1 tw="font-bold text-6xl leading-tight mt-8 max-w-[50%]">{article.title}</h1>
        <div tw="flex items-center mt-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Author's avatar"
            tw="w-12 h-12 rounded-full border-2 border-white"
            height="48"
            src={urlForImage(article.author.image).width(48).height(48).url()}
            style={{
              objectFit: 'cover',
            }}
            width="48"
          />
          <div tw="ml-4 flex flex-col">
            <span tw="font-semibold">{article.author.name}</span>
            <span tw="text-sm">
              {new Date(article.publishedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
        <div tw="absolute right-0 w-[50%] h-full flex justify-end">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={article.mainImage.caption}
            tw="rounded-l-full h-full"
            height="630"
            src={urlForImage(article.mainImage).width(600).height(630).url()}
            style={{
              objectFit: 'cover',
            }}
            width="600"
          />
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Geist-SemiBold',
          data: await fetch(
            new URL(
              '../../../node_modules/geist/dist/fonts/geist-sans/Geist-SemiBold.ttf',
              import.meta.url,
            ),
          ).then((response) => response.arrayBuffer()),
        },
      ],
    },
  )
}

// lil helper for more succinct styles
function font(fontFamily: string) {
  return { fontFamily }
}
