import { FC } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import formatDistanceToNow from 'date-fns/formatDistanceToNow'
import { usePlausible } from 'next-plausible'
import { Post } from '@lib/types/post'
import { urlForImage } from '@lib/sanity'

interface postCardProps {
  post: Post
}

const PostCard: FC<postCardProps> = ({ post }) => {
  const plausible = usePlausible()
  return (
    <article className="w-80 flex flex-col relative max-w-xs grow shrink-0 my-1 mr-5 rounded-lg shadow-lg overflow-hidden">
      <Link href={`/${post.slug}`}>
        <a
          onClick={() =>
            plausible('clickOnRelatedArticles-Image', {
              props: {
                title: post.title,
              },
            })
          }
        >
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
      <div className="relative w-full -top-3 left-3">
        {post.categories.map((category) => {
          if (category === 'FCS' || category === 'FBS') {
            return (
              <Link href={`/${category.toLowerCase()}`} key={post._id}>
                <a
                  onClick={() =>
                    plausible('clickOnRelatedArticles-Category', {
                      props: {
                        title: post.title,
                        category: category,
                      },
                    })
                  }
                  className="text-xs uppercase rounded-full text-white py-1 px-2 bg-red-500 font-bold"
                >
                  {category}
                </a>
              </Link>
            )
          }
        })}
      </div>
      <div className="h-full flex flex-col justify-between">
        <Link href={`/${post.slug}`}>
          <a
            onClick={() =>
              plausible('clickOnRelatedArticles-Title', {
                props: {
                  title: post.title,
                },
              })
            }
          >
            <h4 className="pt-1 text-stone-800 text-xl p-2 mb-2">
              {post.title}
            </h4>
          </a>
        </Link>
      </div>
      <div className="uppercase p-2 pb-3 text-xs text-stone-800 divide-x-2 divide-gray-700/20 divide-solid">
        <time className="first:pl-0 first:pr-2 " dateTime={post.publishedAt}>
          {`${formatDistanceToNow(new Date(post.publishedAt))} ago`}
        </time>
        <Link href={`/authors/${post.author.slug}`}>
          <a
            onClick={() =>
              plausible('clickOnRelatedArticles-Author', {
                props: {
                  title: post.title,
                  author: post.author.name,
                },
              })
            }
            className="last:pl-2 last:pr-0"
          >
            {post.author.name}
          </a>
        </Link>
      </div>
    </article>
  )
}

export default PostCard
