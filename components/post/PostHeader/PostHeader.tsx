import { FC } from 'react'
import Link from 'next/link'
import { PostTitle, Avatar } from '@components/post'

interface PostHeaderProps {
  title: string
  date: string
  author: {
    name: string
    image: string
    slug: string
  }
  category: string
  snippet: string
}
const PostHeader: FC<PostHeaderProps> = ({
  title,
  date,
  author,
  category,
  snippet,
}) => {
  return (
    <>
      <Link href={`/${category.toLowerCase()}`}>
        <a className="text-red-700 font-semibold">
          <span className="text-lg uppercase">{category}</span>
        </a>
      </Link>
      <PostTitle>{title}</PostTitle>
      <p className="mt-5 text-xl leading-5 text-warm-gray-500">{snippet}</p>
      <div className="border-t border-warm-gray-300 py-6 mt-6">
        <Avatar
          name={author.name}
          slug={author.slug}
          image={author.image}
          dateString={date}
        />
      </div>
    </>
  )
}

export default PostHeader
