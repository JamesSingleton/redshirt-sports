export const runtime = 'edge'

import { ImageResponse } from 'next/og'
import { notFound } from 'next/navigation'
import { getOpenGraphDataBySlug } from '@/lib/sanity.fetch'
import { urlForImage } from '@/lib/sanity.image'

export default async function ArticleOGImage({ params: { slug } }: { params: { slug: string } }) {
  const article = await getOpenGraphDataBySlug(slug)
  if (!article) {
    notFound()
  }

  return new ImageResponse(
    (
      <div tw="relative bg-white w-[1200px] h-[630px] flex">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={article.mainImage.caption}
          tw="absolute top-0 left-0 w-full h-full"
          height="630"
          src={urlForImage(article.mainImage).width(1200).height(630).url()}
          style={{
            objectFit: 'cover',
          }}
          width="1200"
        />
        <span tw="absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-30" />
        <div tw="absolute bottom-0 left-0 p-8 flex">
          <div tw="bg-white rounded-lg p-6 max-w-md flex flex-col">
            <h1 tw="text-4xl font-bold leading-tight">{article.title}</h1>
            <div tw="flex items-center mt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={article.author.name}
                tw="h-12 w-12 rounded-full"
                height="48"
                src={urlForImage(article.author.image).width(48).height(48).url()}
                style={{
                  objectFit: 'cover',
                }}
                width="48"
              />
              <div tw="ml-3 flex flex-col">
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
          </div>
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
