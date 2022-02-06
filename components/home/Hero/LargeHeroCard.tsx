import { FC } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePlausible } from 'next-plausible'
import { Post } from '@lib/types/post'
import { urlForImage } from '@lib/sanity'
import { Badge } from '@components/ui'

interface LargeHeroCardProps {
  heroPost: Post
}

const LargeHeroCard: FC<LargeHeroCardProps> = ({ heroPost }) => {
  const plausible = usePlausible()
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-md">
      <Link href={`/${heroPost.slug}`} prefetch={false}>
        <a
          onClick={() =>
            plausible('clickOnHeroImage', {
              props: {
                item: 'large',
              },
            })
          }
        >
          <div className="aspect-w-4 aspect-h-3 relative flex w-full items-start sm:aspect-w-3">
            <div className="rounded-md">
              <Image
                src={
                  urlForImage(heroPost.mainImage).width(742).height(742).url()!
                }
                layout="responsive"
                height={742}
                width={742}
                sizes="50vw"
                className="h-full w-full rounded-md object-cover"
                alt={heroPost.mainImage.caption}
                priority
              />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex flex-grow flex-col bg-gradient-to-t from-black via-black p-5 sm:p-10">
            <div className="mb-3">
              {heroPost.categories.map((category) => {
                if (category === 'FCS' || category === 'FBS') {
                  return (
                    <Badge key={`${category}_${heroPost.title}`}>
                      {category}
                    </Badge>
                  )
                }
              })}
            </div>
            <div className="inline-flex items-center text-xs text-slate-50">
              <h2 className="block text-xl font-semibold sm:text-2xl xl:text-4xl">
                {heroPost.title}
              </h2>
            </div>
          </div>
        </a>
      </Link>
    </article>
  )
}

export default LargeHeroCard
