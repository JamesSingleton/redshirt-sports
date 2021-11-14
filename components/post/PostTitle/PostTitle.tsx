import { FC } from 'react'

const PostTitle: FC = ({ children }) => {
  return (
    <h1 className="text-4xl font-extrabold capitalize tracking-tight">
      {children}
    </h1>
  )
}

export default PostTitle
