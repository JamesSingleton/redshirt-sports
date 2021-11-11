import { GetStaticProps, GetStaticPaths } from 'next'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { ClockIcon } from '@heroicons/react/outline'
import { Layout } from '@components/common'
import { PostHeader } from '@components/post'
import { postQuery, postSlugsQuery } from '@lib/sanityGroqQueries'
import { urlForImage, usePreviewSubscription } from '@lib/sanity'
import { sanityClient, getClient, overlayDrafts } from '@lib/sanity.server'

const messages = [
  {
    id: 1,
    title: 'FCS: Week 11 Games With Playoff Implications',
    time: 'November 10, 2021',
    datetime: '2021-01-27T16:35',
    imageSrc:
      'https://herosports.com/wp-content/uploads/2021/11/Ford_at_Wofford_CroppedLS-75x75.jpg',
    articleLink: '/week-11-games-with-playoffs-implications',
  },
  {
    id: 2,
    title: 'FCS: Week 11 Games With Playoff Implications',
    time: 'November 10, 2021',
    datetime: '2021-01-27T16:35',
    imageSrc:
      'https://herosports.com/wp-content/uploads/2021/11/Ford_at_Wofford_CroppedLS-75x75.jpg',
    articleLink: '/week-11-games-with-playoffs-implications',
  },
  {
    id: 3,
    title: 'FCS: Week 11 Games With Playoff Implications',
    time: 'November 10, 2021',
    datetime: '2021-01-27T16:35',
    imageSrc:
      'https://herosports.com/wp-content/uploads/2021/11/Ford_at_Wofford_CroppedLS-75x75.jpg',
    articleLink: '/week-11-games-with-playoffs-implications',
  },
  {
    id: 4,
    title: 'FCS: Week 11 Games With Playoff Implications',
    time: 'November 10, 2021',
    datetime: '2021-01-27T16:35',
    imageSrc:
      'https://herosports.com/wp-content/uploads/2021/11/Ford_at_Wofford_CroppedLS-75x75.jpg',
    articleLink: '/week-11-games-with-playoffs-implications',
  },
]

const author = {
  picture: '/images/james_singleton.png',
  name: 'James Singleton',
}

const Post = ({ data = {}, preview }) => {
  const router = useRouter()

  const slug = data?.post?.slug
  const {
    data: { post, morePosts },
  } = usePreviewSubscription(postQuery, {
    params: { slug },
    initialData: data,
    enabled: preview && slug,
  })
  return (
    <>
      <div className="sm:my-8 max-w-3xl mx-auto grid grid-cols-1 gap-6 sm:px-6 lg:max-w-7xl lg:grid-col-dense lg:grid-cols-3">
        <section
          aria-labelledby="timeline-title"
          className="hidden lg:block lg:col-start-1 lg:col-span-1"
        >
          <div className="sticky top-24 space-y-4">
            <div className="bg-white px-4 pb-5 shadow sm:rounded-lg sm:px-6 ">
              <ul role="list" className="divide-y space-y-5 divide-gray-200">
                {messages.map((message) => (
                  <li
                    key={message.id}
                    className="relative bg-white pt-5 hover:bg-gray-50 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600"
                  >
                    <div className="flex justify-between space-x-3">
                      <div>
                        <Image
                          alt="Image"
                          src={message.imageSrc}
                          width="75"
                          height="75"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <a
                          href={message.articleLink}
                          className="block focus:outline-none"
                        >
                          <span
                            className="absolute inset-0"
                            aria-hidden="true"
                          />
                          <p className="text-sm font-medium text-gray-900">
                            {message.title}
                          </p>
                          <span className="flex-shrink-0 whitespace-nowrap text-sm text-gray-500">
                            <ClockIcon className="w-3 h-3 mr-1 inline-block" />
                            <time dateTime={message.datetime}>
                              {message.time}
                            </time>
                          </span>
                        </a>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
        <div className="space-y-6 lg:col-start-2 lg:col-span-2">
          <article aria-labelledby="applicant-information-title">
            <div className="bg-white shadow sm:rounded-lg">
              <div className="w-full relative">
                <div>
                  <Image
                    src={urlForImage(post.mainImage)
                      .height(574)
                      .width(1020)
                      .url()}
                    width="1020"
                    height="574"
                    layout="responsive"
                    alt="Missouri State"
                    className="sm:rounded-t-lg"
                  />
                </div>
              </div>
              {/* Article */}
              <div className="my-0 mx-auto px-4 max-w-2xl py-10 xl:px-0">
                <PostHeader
                  author={post.author}
                  title={post.title}
                  category={post.category.title}
                  date={post.publishedAt}
                  snippet="It was the culmination of years of scuttlebutt and rumors Saturday morning at the Atlantic Union Bank Center."
                />
                <div className="my-6 prose prose-indigo prose-lg text-gray-500 mx-auto">
                  <p>
                    Faucibus commodo massa rhoncus, volutpat.{' '}
                    <strong>Dignissim</strong> sed{' '}
                    <strong>eget risus enim</strong>. Mattis mauris semper sed
                    amet vitae sed turpis id. Id dolor praesent donec est. Odio
                    penatibus risus viverra tellus varius sit neque erat velit.
                    Faucibus commodo massa rhoncus, volutpat. Dignissim sed eget
                    risus enim. <a href="#">Mattis mauris semper</a> sed amet
                    vitae sed turpis id.
                  </p>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </>
  )
}

Post.Layout = Layout

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
}) => {
  const { post, morePosts } = await getClient(preview).fetch(postQuery, {
    slug: params?.slug,
  })

  return {
    props: {
      preview,
      data: {
        post,
        morePosts: overlayDrafts(morePosts),
      },
    },
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = await sanityClient.fetch(postSlugsQuery)

  return {
    paths: paths.map((slug: string) => ({ params: { slug } })),
    fallback: true,
  }
}

export default Post
