import { FC } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Post } from '@lib/types/post'
import styles from './PostCard.module.css'
import { urlForImage } from '@lib/sanity'

interface postCardProps {
  post: Post
}

const PostCard: FC<postCardProps> = ({ post }) => {
  return (
    <article className="w-80 flex flex-col relative max-w-xs grow shrink-0 my-1 mr-5 rounded-lg shadow-lg overflow-hidden">
      <Link href={`/${post.slug}`}>
        <a>
          <Image
            className="max-h-96 w-full object-cover"
            src={urlForImage(post.mainImage).url()!}
            alt={post.mainImage.caption}
            height="175"
            width="320"
            layout="responsive"
          />
        </a>
      </Link>
      <div className={styles.pills}>
        {post.categories.map((category) => {
          if (category === 'FCS' || category === 'FBS') {
            return (
              <Link href={`/${category.toLowerCase()}`} key={post._id}>
                <a className="text-xs uppercase rounded-full text-white py-1 px-2 bg-red-500 font-bold">
                  {category}
                </a>
              </Link>
            )
          }
        })}
      </div>
      <div className="h-full flex flex-col justify-between">
        <Link href={`/${post.slug}`}>
          <a>
            <h4 className="pt-1 text-stone-800 text-xl p-2 mb-2">
              {post.title}
            </h4>
          </a>
        </Link>
      </div>
      <div className="uppercase p-2 pb-3 text-xs text-stone-800">
        <time dateTime={post.publishedAt}>11 hours ago</time>
        <Link href={`/authors/${post.author.slug}`}>
          <a>{post.author.name}</a>
        </Link>
      </div>
    </article>
  )
}

export default PostCard
