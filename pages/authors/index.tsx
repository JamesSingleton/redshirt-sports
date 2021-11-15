import { GetStaticProps } from 'next'
import Image from 'next/image'
import { Layout } from '@components/common'
import { getClient } from '@lib/sanity.server'
import { allAuthors } from '@lib/sanityGroqQueries'
import { urlForImage, PortableText } from '@lib/sanity'

const people = [
  {
    name: 'Emma Dorsey',
    role: 'Senior Front-end Developer',
    imageUrl:
      'https://images.unsplash.com/photo-1505840717430-882ce147ef2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=8&w=1024&h=1024&q=80',
    bio: 'Ultricies massa malesuada viverra cras lobortis. Tempor orci hac ligula dapibus mauris sit ut eu. Eget turpis urna maecenas cras. Nisl dictum.',
    twitterUrl: '#',
    linkedinUrl: '#',
  },
  // More people...
]

const Authors = ({ authors }: any) => {
  return (
    <div>
      <div className="mx-auto py-12 px-4 max-w-7xl sm:px-6 lg:px-8 lg:py-24">
        <div className="space-y-12 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
          <div className="space-y-5 sm:space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Our Team
            </h2>
            <p className="text-xl text-gray-500">
              Nulla quam felis, enim faucibus proin velit, ornare id pretium.
              Augue ultrices sed arcu condimentum vestibulum suspendisse.
              Volutpat eu faucibus vivamus eget bibendum cras.
            </p>
          </div>
          <div className="lg:col-span-2">
            <ul
              role="list"
              className="space-y-12 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-12 sm:space-y-0 lg:gap-x-8"
            >
              {authors.map((author: any) => (
                <li key={author._id}>
                  <div className="space-y-4">
                    <div>
                      <Image
                        className="object-cover shadow-lg rounded-lg"
                        src={
                          urlForImage(author.image)
                            .width(384)
                            .height(256)
                            .url()!
                        }
                        alt=""
                        width="384"
                        height="256"
                        layout="responsive"
                      />
                    </div>
                    <div className="text-lg leading-6 font-medium space-y-1">
                      <h3>{author.name}</h3>
                      <p className="text-indigo-600">{author.role}</p>
                    </div>
                    <div className="text-lg">
                      <p className="text-gray-500">
                        <PortableText blocks={author.bio} />
                      </p>
                    </div>

                    <ul role="list" className="flex space-x-5">
                      <li>
                        <a
                          href={author.twitterURL}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <span className="sr-only">Twitter</span>
                          <svg
                            className="w-5 h-5"
                            aria-hidden="true"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                          </svg>
                        </a>
                      </li>
                    </ul>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

Authors.Layout = Layout

export const getStaticProps: GetStaticProps = async () => {
  const authors = await getClient().fetch(allAuthors)

  return {
    props: {
      authors,
    },
  }
}

export default Authors
