import { FC } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePlausible } from 'next-plausible'
import { Post } from '@lib/types/post'
import { urlForImage } from '@lib/sanity'
import { Badge } from '@components/ui'

interface SmallHeroCardProps {
  post: Post
}

const SmallHeroCard: FC<SmallHeroCardProps> = ({ post }) => {
  const plausible = usePlausible()
  return (
    <div className="rounded-md relative flex flex-col group overflow-hidden sm:row-span-3 col-span-1">
      <Link href={`/${post.slug}`} prefetch={false}>
        <a
          onClick={() =>
            plausible('clickOnHeroImage', {
              props: {
                item: 'small',
              },
            })
          }
        >
          <div className="flex items-start relative w-full aspect-w-4 sm:aspect-w-3 aspect-h-3">
            <div className="rounded-md">
              <Image
                src={urlForImage(post.mainImage).width(361).height(437).url()!}
                className="object-cover w-full h-full rounded-md"
                height={437}
                width={361}
                sizes="50vw"
                layout="responsive"
                alt={post.mainImage.caption}
              />
            </div>
          </div>
          <div className="absolute bottom-0 inset-x-0 p-6 flex flex-col flex-grow bg-gradient-to-t from-black via-black">
            <div className="mb-3">
              {post.categories.map((category) => {
                if (category === 'FCS' || category === 'FBS') {
                  return (
                    <Badge key={`${category}_${post.title}`}>{category}</Badge>
                  )
                }
              })}
            </div>
            <div className="inline-flex items-center text-xs text-slate-50">
              <h2 className="block font-semibold text-slate-50 text-lg">
                {post.title}
              </h2>
            </div>
          </div>
        </a>
      </Link>
    </div>
  )
}

export default SmallHeroCard
