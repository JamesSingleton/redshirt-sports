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
    <div className="rounded-md relative flex flex-col group overflow-hidden">
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
          <div className="flex items-start relative w-full aspect-w-4 sm:aspect-w-3 aspect-h-3">
            <div className="rounded-md">
              <Image
                src={
                  urlForImage(heroPost.mainImage).width(742).height(742).url()!
                }
                layout="responsive"
                height={742}
                width={742}
                sizes="50vw"
                className="object-cover w-full h-full rounded-md"
                alt={heroPost.mainImage.caption}
                priority
              />
            </div>
          </div>
          <div className="absolute bottom-0 inset-x-0 p-5 sm:p-10 flex flex-col flex-grow bg-gradient-to-t from-black via-black">
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
              <h2 className="block font-semibold text-xl sm:text-2xl xl:text-4xl">
                {heroPost.title}
              </h2>
            </div>
          </div>
        </a>
      </Link>
    </div>
  )
}

export default LargeHeroCard
