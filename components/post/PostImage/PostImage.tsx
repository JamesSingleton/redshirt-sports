import { FC } from 'react'
import Image from 'next/image'
import { CameraIcon } from '@heroicons/react/solid'
import { urlForImage } from '@lib/sanity'

interface PostImageProps {
  image: {
    caption: string
    attribution: string
  }
}

const PostImage: FC<PostImageProps> = ({ image }) => (
  <div className="container my-10 mx-auto px-4 sm:my-12 xl:px-32">
    <figure>
      <Image
        className="h-full w-full rounded-md"
        src={urlForImage(image).width(1280).height(606).url()!}
        width={1280}
        height={606}
        alt={image.caption}
        layout="responsive"
        sizes="50vw"
        objectFit="cover"
        priority
      />
      <figcaption className="mt-3 flex text-sm">
        <CameraIcon className="h-5 w-5 flex-none" aria-hidden="true" />
        <span className="ml-2">{`Source: ${image.attribution}`}</span>
      </figcaption>
    </figure>
  </div>
)

export default PostImage
