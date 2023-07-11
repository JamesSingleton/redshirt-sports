import { MoveRight, CheckCircle, ArrowLeftToLine, ArrowRightToLine, Edit3 } from 'lucide-react'

import { getTransferPortalPlayers } from '@lib/sanity.client'
import { ImageComponent } from '@components/ui'

export default async function Page({ params }: { params: { year: string } }) {
  const { year } = params
  const transferPortalEntries = await getTransferPortalPlayers()

  return (
    <section>
      <div className="py-12 sm:py-20 lg:py-24">
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
        <div className="hidden items-end justify-center border-b-2 border-zinc-300 md:grid md:grid-cols-header-medium md:grid-areas-header-medium lg:grid-cols-header lg:grid-areas-header">
          <span className="grid-in-player">Player</span>
          <span className="hidden grid-in-position lg:block" aria-label="Position">
            Pos.
          </span>
          <span className="grid-in-current">Status</span>
          <span className="grid-in-last">Last Team</span>
          <span className="grid-in-new">New Team</span>
        </div>
        <ul className="flex flex-col space-y-4">
          {transferPortalEntries.map((transferPortalEntry: any) => (
            <li key={transferPortalEntry._id}>
              <div className="grid grid-cols-small items-center border-b-8 border-border p-4 grid-areas-small md:grid-cols-medium md:p-0 md:grid-areas-medium lg:grid-cols-large lg:grid-areas-large">
                <ImageComponent
                  image={transferPortalEntry.player.image}
                  alt={transferPortalEntry.player.name}
                  className="rounded grid-in-avatar"
                  width={90}
                  height={90}
                />
                <span className="self-start text-center text-base font-normal leading-normal tracking-wider grid-in-position lg:self-center lg:justify-self-center">
                  {transferPortalEntry.player.position}
                </span>
                <div className="grid-in-details xl:mx-0 xl:my-4">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-base font-semibold italic leading-tight tracking-wide">
                      {transferPortalEntry.player.name}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <span></span>
                    <span className="text-xs font-normal leading-normal tracking-wider after:ml-1 after:content-['/']">{`${transferPortalEntry.player.height.feet}-${transferPortalEntry.player.height.inches}`}</span>
                    <span className="text-xs font-normal leading-normal tracking-wider">
                      {transferPortalEntry.player.weight}
                    </span>
                  </div>
                  <div className="mb-1 flex flex-wrap gap-x-1">
                    <span className="text-xs font-normal leading-normal tracking-wider">
                      {transferPortalEntry.player.highSchool}
                    </span>
                    <span className="text-xs font-normal leading-normal tracking-wider">
                      {`(${transferPortalEntry.player.homeTown.city}, ${transferPortalEntry.player.homeTown.state})`}
                    </span>
                  </div>
                </div>
                <div className="mb-4 rounded bg-secondary grid-in-current">
                  <div className="flex items-center gap-2 rounded px-2 py-1">
                    <div className="flex items-center">
                      {transferPortalEntry.transferStatus === 'Entered' && (
                        <ArrowRightToLine className="h-5 w-5" />
                      )}
                      {transferPortalEntry.transferStatus === 'Committed' && (
                        <CheckCircle className="h-5 w-5" />
                      )}
                      {transferPortalEntry.transferStatus === 'Signed' && (
                        <Edit3 className="h-5 w-5 text-emerald-500" />
                      )}
                      {transferPortalEntry.transferStatus === 'Withdrawn' && (
                        <ArrowLeftToLine className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <span className="text-xs uppercase">{transferPortalEntry.transferStatus}</span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-transfer-status items-center gap-x-3 gap-y-4 border-t border-border grid-areas-transfer-status grid-in-status sm:mt-0 sm:border-none sm:pt-0 md:grid-cols-transfer-status-medium">
                  <div className="flex items-center justify-center grid-in-last">
                    <ImageComponent
                      image={transferPortalEntry.transferringFrom.image}
                      alt={transferPortalEntry.transferringFrom.name}
                      width={32}
                      height={32}
                      className="h-8 w-8"
                    />
                  </div>
                  <MoveRight className="h-7 w-7 grid-in-arrow" />
                  <div className="flex items-center justify-center gap-3 grid-in-new">
                    <ImageComponent
                      image={transferPortalEntry.transferringTo.image}
                      alt={transferPortalEntry.transferringTo.name}
                      width={48}
                      height={48}
                      className="h-12 w-12"
                    />
                    <span className="md:hidden">{transferPortalEntry.transferringTo.name}</span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
