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
    <div className="group relative col-span-1 flex flex-col overflow-hidden rounded-md sm:row-span-3">
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
          <div className="aspect-w-4 aspect-h-3 relative flex w-full items-start sm:aspect-w-3">
            <div className="rounded-md">
              <Image
                src={urlForImage(post.mainImage).width(361).height(437).url()!}
                className="h-full w-full rounded-md object-cover"
                height={437}
                width={361}
                sizes="50vw"
                layout="responsive"
                alt={post.mainImage.caption}
              />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex flex-grow flex-col bg-gradient-to-t from-black via-black p-6">
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
              <h2 className="block text-lg font-semibold text-slate-50">
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
