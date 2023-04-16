import Image from 'next/image'
import {
  Instagram,
  Twitter,
  Facebook,
  SpotifyIcon,
  ApplePodcastIcon,
  OvercastIcon,
} from '@components/common/icons'

export default async function Page({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { [key: string]: string }
}) {
  return (
    <>
      <section className="bg-slate-50 py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="mx-auto max-w-xl px-6 sm:px-12 md:max-w-3xl lg:max-w-7xl lg:px-8">
          <div className="flex w-full flex-col items-center md:flex-row md:justify-between">
            <div className="flex flex-col items-center md:flex-row">
              <Image
                src="/images/empty-state.png"
                alt={`Author profile picture`}
                width={96}
                height={96}
                className="h-24 w-24 shrink-0 overflow-hidden rounded-xl object-cover"
              />
              <div className="mt-6 text-center md:ml-5 md:mt-0 md:text-left">
                <span className="block text-xs uppercase tracking-widest text-brand-500">
                  Author Role
                </span>
                <h1 className="mt-1 font-cal text-3xl font-medium tracking-normal text-slate-900 sm:text-4xl md:tracking-tight lg:leading-tight">
                  Author Name
                </h1>
              </div>
            </div>
            <div className="mt-6 md:mt-0">
              <ul className="flex items-center space-x-3">{/* Map over Social Media */}</ul>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-xl px-4 py-12 sm:px-12 sm:py-16 md:max-w-3xl lg:max-w-7xl lg:px-8 lg:py-24">
        <div className="w-full lg:grid lg:grid-cols-3 lg:gap-8 xl:gap-12">
          <div className="col-span-2">
            <h2 className="relative border-b border-slate-300 pb-3 font-cal text-2xl font-medium text-slate-900 before:absolute before:-bottom-[1px] before:left-0 before:h-px before:w-24 before:bg-brand-500">
              Articles Written by [Author]
            </h2>
            <div className="mt-6 pt-8 sm:mt-10 sm:pt-10"></div>
          </div>
          <div className="mt-12 w-full sm:mt-16 lg:col-span-1 lg:mt-0">
            <div className="w-full rounded-2xl bg-slate-50 p-5 sm:p-8">
              <h2 className="relative border-b border-slate-300 pb-3 font-cal text-2xl font-medium text-slate-900 before:absolute before:-bottom-[1px] before:left-0 before:h-px before:w-24 before:bg-brand-500">{`About Author`}</h2>
              <div className="pt-6 text-base leading-loose text-slate-600">Author's Bio</div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
