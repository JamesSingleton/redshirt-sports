import { FC } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ClockIcon } from '@heroicons/react/outline'

const Hero: FC = () => {
  return (
    <div className="relative overflow-hidden shadow sm:rounded-lg">
      <div className="relative">
        <section className="realtive w-full">
          <Link href="#">
            <a>
              <div className="relative w-full h-full">
                <Image
                  src="https://images.unsplash.com/photo-1617051399485-3eae5f3ddaee?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=2668&q=80"
                  alt="People working on laptops"
                  width="850"
                  height="400"
                  layout="responsive"
                  objectFit="cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-800 via-gray-200 to-gray-50 mix-blend-multiply" />
              </div>
            </a>
          </Link>
          <div className="px-5 pb-5 pt-14 text-left absolute w-full top-auto left-0 bottom-0">
            <div className="w-full">
              <div className="relative mb-1 sm:mb-2.5 left-auto top-auto">
                <span className="text-gray-50 uppercase p-0 text-xs font-normal">
                  FBS
                </span>
              </div>
              <div className="m-0 w-full transform-none">
                <Link href="#">
                  <a>
                    <h2 className="text-3xl font-extrabold text-white">
                      Nebraska
                    </h2>
                  </a>
                </Link>
              </div>
              <p className="sr-only">
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Illum
                commodi nemo, ipsam inventore eos dignissimos iusto nam
                perferendis quos! Dolore asperiores cupiditate odio, impedit
                voluptatum voluptatem labore vel expedita amet!
              </p>
              <div className="mt-1 relative w-full hidden sm:block">
                <span className="text-gray-50 text-xs font-normal">
                  <a>James Singleton</a>
                </span>
                <span className="text-gray-50 ml-2 text-xs font-normal">
                  <ClockIcon className="w-3 h-3 mr-1 inline-block" />
                  November 8, 2021
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Hero
