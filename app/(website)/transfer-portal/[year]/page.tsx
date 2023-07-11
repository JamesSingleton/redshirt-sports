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
        <div className="hidden md:grid items-end justify-center border-b-2 border-zinc-300 grid-areas-header grid-cols-header">
          <span className="grid-in-player">Player</span>
          <span className="grid-in-position" aria-label="Position">
            Pos.
          </span>
          <span className="grid-in-current">Status</span>
          <span className="grid-in-last">Last Team</span>
          <span className="grid-in-new">New Team</span>
        </div>
        <ul className="flex flex-col space-y-4">
          {transferPortalEntries.map((transferPortalEntry: any) => (
            <li key={transferPortalEntry._id}>
              <div className="grid items-center gap-x-4 border-b-8 border-border p-4 grid-cols-small grid-areas-small sm:grid-areas-medium">
                <ImageComponent
                  image={transferPortalEntry.player.image}
                  alt={transferPortalEntry.player.name}
                  className="grid-in-avatar rounded"
                  width={90}
                  height={90}
                />
                <span className="grid-in-position text-base tracking-wider font-normal leading-normal text-center self-start xl:justify-self-center xl:self-center">
                  {transferPortalEntry.player.position}
                </span>
                <div className="grid-in-details xl:my-4 xl:mx-0">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="font-semibold text-base leading-tight tracking-wide italic">
                      {transferPortalEntry.player.name}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <span></span>
                    <span className="text-xs font-normal leading-normal tracking-wider after:content-['/'] after:ml-1">{`${transferPortalEntry.player.height.feet}-${transferPortalEntry.player.height.inches}`}</span>
                    <span className="text-xs font-normal leading-normal tracking-wider">
                      {transferPortalEntry.player.weight}
                    </span>
                  </div>
                  <div className="flex flex-wrap mb-1 gap-x-1">
                    <span className="text-xs font-normal leading-normal tracking-wider">
                      {transferPortalEntry.player.highSchool}
                    </span>
                    <span className="text-xs font-normal leading-normal tracking-wider">
                      {`(${transferPortalEntry.player.homeTown.city}, ${transferPortalEntry.player.homeTown.state})`}
                    </span>
                  </div>
                </div>
                <div className="grid-in-current gap-y-2 mb-4 bg-secondary rounded">
                  <div className="py-1 px-2 flex rounded items-center gap-2">
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
                    <span>{transferPortalEntry.transferStatus}</span>
                  </div>
                </div>
                <div className="grid-in-status gap-x-3 gap-y-4 border-t border-border sm:border-none sm:pt-0 sm:mt-0 grid items-center mt-4 grid-areas-transfer-status grid-cols-transfer-status">
                  <div className="flex items-center justify-center grid-in-last">
                    <ImageComponent
                      image={transferPortalEntry.transferringFrom.image}
                      alt={transferPortalEntry.transferringFrom.name}
                      width={32}
                      height={32}
                      className="h-8 w-8"
                    />
                  </div>
                  <MoveRight className="grid-in-arrow h-7 w-7" />
                  <div className="grid-in-new flex items-center gap-3">
                    <div className="p-3 xl:py-5 xl:px-3">
                      <ImageComponent
                        image={transferPortalEntry.transferringTo.image}
                        alt={transferPortalEntry.transferringTo.name}
                        width={48}
                        height={48}
                        className="h-12 w-12"
                      />
                    </div>
                    <span className="xl:hidden">{transferPortalEntry.transferringTo.name}</span>
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
