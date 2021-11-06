import { FC } from 'react'
import Image from 'next/image'

const Hero: FC = () => {
  return (
    <div>
      <div className="relative">
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gray-100" />
        <div className="max-w-none mx-auto">
          <div className="relative shadow-xl sm:rounded-lg sm:overflow-hidden">
            <div className="">
              <Image
                src="https://images.unsplash.com/photo-1617051399485-3eae5f3ddaee?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=2668&q=80"
                alt="People working on laptops"
                width="750"
                height="375"
                layout="responsive"
                objectFit="cover"
              />
              <div className="absolute z-10 text-lg -mt-60 text-left text-white px-4">
                <h1 className="font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                  <span className="block text-white">Nebraska Huskers</span>
                </h1>
                <p className="mt-6 max-w-lg mx-auto text-xl text-gray-100 sm:max-w-3xl">
                  Anim aute id magna aliqua ad ad non deserunt sunt. Qui irure
                  qui lorem cupidatat commodo. Elit sunt amet fugiat veniam
                  occaecat fugiat aliqua.
                </p>
              </div>
              <div className="absolute inset-0 mix-blend-multiply bg-gradient-to-t from-gray-900 via-gray-100 to-gray-50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero
