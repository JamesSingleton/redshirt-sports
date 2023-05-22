import Image from 'next/image'
import { ArrowRightIcon } from '@heroicons/react/24/solid'

import { urlForImage } from '@lib/sanity.image'
import { getTransferPortalPlayers } from '@lib/sanity.client'

export default async function Page({ params }: { params: { year: string } }) {
  const { year } = params
  const transferPortalEntries = await getTransferPortalPlayers()

  return (
    <section>
      <div className="bg-zinc-100 py-12 dark:bg-zinc-800 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-xl px-4 sm:px-12 md:max-w-3xl lg:max-w-7xl lg:px-8">
          <div className="flex w-full flex-col items-center md:flex-row md:justify-between">
            <div className="order-2 mt-8 flex flex-col items-center md:order-1 md:mt-0 md:flex-row">
              <div className="mt-6 text-center md:mt-0 md:text-left">
                <h1 className="mt-1 font-cal text-3xl font-medium tracking-normal sm:text-4xl md:tracking-wider lg:text-5xl lg:leading-tight">
                  {`${year} College Football Transfer Portal`}
                </h1>
                <p className="mt-4 text-base text-zinc-700 dark:text-zinc-200">
                  Redshirt Sports diligently tracks the NCAA Transfer Portal, ensuring you stay
                  informed about college athletes making transfers. Our platform provides valuable
                  insights into the previous and new schools of these players, enabling you to keep
                  up with the latest transfer news. Trust Redshirt Sports for comprehensive coverage
                  of the transfer portal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-12 sm:py-16 md:max-w-3xl lg:max-w-7xl lg:px-8 lg:py-24">
        <ul role="list" className="divide-y divide-zinc-200">
          {transferPortalEntries.map((transferPortalEntry: any) => (
            <li
              key={transferPortalEntry._id}
              className="grid grid-cols-5 items-center gap-x-6 py-5"
            >
              <div className="flex items-center">
                <span className="inline-flex items-center rounded-md bg-pink-50 px-2 py-1 text-base font-medium text-pink-700 ring-1 ring-inset ring-pink-700/10">
                  {transferPortalEntry.transferStatus}
                </span>
              </div>
              <div className="flex flex-row justify-center gap-4">
                <Image
                  src={urlForImage(transferPortalEntry.player.image).url() || ''}
                  alt={transferPortalEntry.player.name}
                  width={90}
                  height={90}
                  className="rounded-md object-contain"
                />
                <div>
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                    {transferPortalEntry.player.name}
                  </h3>
                  <p className="text-sm text-zinc-700 dark:text-zinc-200">
                    {transferPortalEntry.player.position}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3">
                <Image
                  src={urlForImage(transferPortalEntry.transferringFrom.image).url() || ''}
                  alt={transferPortalEntry.transferringFrom.name}
                  width={30}
                  height={30}
                />
                <ArrowRightIcon className="h-8 w-8" />
                <Image
                  src={
                    urlForImage(transferPortalEntry.transferringTo.image).format('webp').url() || ''
                  }
                  alt={transferPortalEntry.transferringTo.name}
                  width={50}
                  height={50}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
