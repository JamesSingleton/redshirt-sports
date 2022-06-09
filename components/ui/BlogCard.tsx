import Link from 'next/link'
import { urlForImage } from '@lib/sanity'
import BlurImage from './BlurImage'
import Date from './Date'

import type { Post } from '@types'

interface BlogCardProps {
  data: Post
}

export default function BlogCard({ data }: BlogCardProps) {
  return (
    <Link href={`/${data.slug}`}>
      <a>
        <div className="ease overflow-hidden rounded-2xl border-2 border-slate-100 bg-white shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
          {data.mainImage ? (
            <BlurImage
              src={urlForImage(data.mainImage).url()}
              alt={data.mainImage.caption ?? 'Blog '}
              width={500}
              height={400}
              layout="responsive"
              objectFit="cover"
              placeholder="blur"
              blurDataURL={data.mainImage.asset.metadata.lqip ?? undefined}
            />
          ) : (
            <div className="absolute flex h-full w-full select-none items-center justify-center bg-slate-100 text-4xl">
              ?
            </div>
          )}
          <div className=" h-36 border-t border-slate-200 py-5 px-5">
            <h3 className="font-cal text-xl tracking-wide text-slate-900 line-clamp-2">
              {data.title}
            </h3>
            <p className="text-md my-2 truncate italic text-slate-600">
              {data.excerpt}
            </p>
            <p className="my-2 text-sm text-slate-600">
              Published <Date dateString={data.publishedAt.toString()} />
            </p>
          </div>
        </div>
      </a>
    </Link>
  )
}
