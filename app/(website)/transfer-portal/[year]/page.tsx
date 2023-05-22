import Image from 'next/image'

import { urlForImage } from '@lib/sanity.image'
import { getTransferPortalPlayers } from '@lib/sanity.client'

export default async function Page({ params }: { params: { year: string } }) {
  const { year } = params
  const transferPortalEntries = await getTransferPortalPlayers()
  console.log(transferPortalEntries)
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
        <ul role="list" className="space-y-3">
          {transferPortalEntries.map((transferPortalEntry: any) => (
            <li key={transferPortalEntry._id}>
              <div className="grid">
                <Image
                  src={urlForImage(transferPortalEntry.player.image).url() || ''}
                  alt={transferPortalEntry.player.name}
                  width={90}
                  height={90}
                  className="rounded-md object-contain"
                />
                <div className="flex flex-col justify-center">
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                    {transferPortalEntry.player.name}
                  </h3>
                  <p className="text-sm text-zinc-700 dark:text-zinc-200">
                    {transferPortalEntry.player.position}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
