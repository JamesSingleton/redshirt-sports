import { FC } from 'react'
import Link from 'next/link'
import {
  TwitterShareButton,
  TwitterIcon,
  FacebookShareButton,
  FacebookIcon,
} from 'react-share'
import { PostTitle, Avatar } from '@components/post'
import { usePlausible } from 'next-plausible'

interface PostHeaderProps {
  title: string
  date: string
  author: {
    name: string
    image: string
    slug: string
  }
  categories: string[]
  snippet: string
  slug: string
}
const PostHeader: FC<PostHeaderProps> = ({
  title,
  date,
  author,
  categories,
  snippet,
  slug,
}) => {
  const plausible = usePlausible()
  return (
    <>
      {categories.map((category) => {
        if (category === 'FCS' || category === 'FBS') {
          return (
            <Link
              href={`/${category.toLowerCase()}`}
              prefetch={false}
              key={title}
            >
              <a
                onClick={() =>
                  plausible('clickOnPostCategory', {
                    props: {
                      category: category,
                    },
                  })
                }
              >
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm uppercase font-medium bg-red-700 text-white">
                  {category}
                </span>
              </a>
            </Link>
          )
        }
      })}
      <PostTitle>{title}</PostTitle>
      <p className="mt-5 text-xl leading-5 text-stone-500">{snippet}</p>
      <div className="border-t border-stone-300 pt-6 mt-6">
        <Avatar
          name={author.name}
          slug={author.slug}
          image={author.image}
          dateString={date}
        />
        <div className="space-x-2 mt-6">
          <FacebookShareButton
            url={`https://www.redshirtsports.xyz/${slug}?utm_source=Facebook&utm_medium=social`}
            quote={title}
            onClick={() =>
              plausible('clickOnSocialButton', {
                props: {
                  social: 'Facebook',
                },
              })
            }
          >
            <FacebookIcon size={32} round />
          </FacebookShareButton>
          <TwitterShareButton
            url={`https://www.redshirtsports.xyz/${slug}?utm_source=Twitter&utm_medium=social`}
            title={title}
            onClick={() =>
              plausible('clickOnSocialButton', {
                props: {
                  social: 'Twitter',
                },
              })
            }
          >
            <TwitterIcon size={32} round />
          </TwitterShareButton>
        </div>
      </div>
    </>
  )
}

export default PostHeader
