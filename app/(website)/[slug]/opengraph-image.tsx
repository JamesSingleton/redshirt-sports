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

  const svgDots = encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" fill="none"><circle fill="rgb(220,39,39)" id="pattern-circle" cx="10" cy="10" r="1.6257413380501518"></circle></svg>',
  )

  return new ImageResponse(
    (
      <div
        tw="bg-zinc-900 flex h-full w-full px-4"
        style={{
          backgroundImage: `url("data:image/svg+xml,${svgDots}")`,
          ...font('Geist-SemiBold'),
        }}
      >
        <div tw="flex flex-col justify-between h-full">
          <div tw="p-4 pt-8 pb-0 flex flex-row items-center w-full text-3xl">
            <div tw="flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                tw="w-14 h-14"
                alt="Redshirt Sports Logo"
                src="https://www.redshirtsports.xyz/images/icons/RS_192.png"
              />
              <span tw="text-[#DC2727]">Redshirt Sports</span>
            </div>
            <div tw="flex items-center text-zinc-100 ml-auto">redshirtsports.xyz</div>
          </div>
          <div tw="p-4 flex flex-row justify-center items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Article Image"
              tw="w-1/2 rounded-lg overflow-hidden dark:border-gray-800"
              height={300}
              src={urlForImage(article.mainImage).url()}
              width={300}
              style={{
                objectFit: 'cover',
              }}
            />
            <div tw="ml-4 flex flex-col w-1/2">
              <h3 tw="text-5xl font-bold mb-2  text-[#DC2727]">{article.title}</h3>
              <p tw="text-3xl text-zinc-100">by {article.author}</p>
            </div>
          </div>
          <div tw="p-4 pb-8 flex">
            <div tw="text-zinc-100 flex items-center text-2xl justify-between w-full">
              <span>
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
