import { FC } from 'react'
import Link from 'next/link'
import { usePlausible } from 'next-plausible'

import { BlurImage } from '@components/ui'
import { urlForImage } from '@lib/sanity'

import type { Post } from '@types'

interface MostReadProps {
  mostReadArticles: Post[]
}

const MostRead: FC<MostReadProps> = ({ mostReadArticles }) => {
  const plausible = usePlausible()

  return (
    <div className="w-full rounded-2xl bg-slate-50 p-5 sm:p-8">
      <h2 className="relative border-b border-slate-300 pb-2 text-2xl font-medium text-slate-900 before:absolute before:left-0 before:-bottom-[1px] before:h-px before:w-24 before:bg-brand-500">
        Most Read
      </h2>
      <div className="space-y-6 pt-6 sm:space-y-5 lg:space-y-6 xl:space-y-5">
        {mostReadArticles.map((mostReadArticle) => (
          <article key={mostReadArticle._id} className="flex space-x-4 sm:space-x-6 lg:space-x-4">
            <Link href={`/${mostReadArticle.slug}`}>
              <a
                onClick={() =>
                  plausible('clickOnPopularPost', {
                    props: {
                      title: mostReadArticle.title,
                      item: 'image',
                    },
                  })
                }
                className="h-24 w-24 overflow-hidden rounded-2xl sm:h-28 sm:w-28 lg:h-20 lg:w-20 xl:h-24 xl:w-24"
              >
                <BlurImage
                  alt={mostReadArticle.mainImage.caption}
                  src={urlForImage(mostReadArticle.mainImage).width(96).height(96).url()}
                  blurDataURL={mostReadArticle.mainImage.asset.metadata.lqip ?? undefined}
                  width={96}
                  height={96}
                  layout="responsive"
                  className="rounded-2xl"
                />
              </a>
            </Link>
            <div className="w-2/3">
              <div className="flex h-full w-full flex-1 flex-col justify-center">
                <div>
                  <Link href={`/${mostReadArticle.slug}`}>
                    <a
                      onClick={() =>
                        plausible('clickOnPopularPost', {
                          props: {
                            title: mostReadArticle.title,
                            item: 'title',
                          },
                        })
                      }
                      className="text-lg font-medium leading-snug tracking-normal text-slate-900 decoration-slate-800 decoration-2 transition duration-300 ease-in-out line-clamp-2 hover:underline"
                    >
                      {mostReadArticle.title}
                    </a>
                  </Link>
                </div>
                <div className="mt-2 flex h-12 items-center text-sm">
                  <span className="text-slate-500">By&nbsp;</span>
                  <Link href={`/authors/${mostReadArticle.author.slug}`}>
                    <a
                      onClick={() =>
                        plausible('clickOnPopularPost', {
                          props: {
                            title: mostReadArticle.title,
                            item: 'author name',
                          },
                        })
                      }
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {mostReadArticle.author.name}
                    </a>
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default MostRead
