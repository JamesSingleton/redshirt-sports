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
      <div className="container">
        <div className="grid-areas-header grid-cols-header grid border-b-2 border-border">
          <span className="grid-in-player text-sm font-semibold tracking-wide leading-normal">Player</span>
          <span className="grid-in-position justify-self-center" aria-label="Position">Pos</span>
          <span className="grid-in-current">Status</span>
          <span className="grid-in-last">Last Team</span>
          <span className="grid-in-new">New Team</span>
        </div>
        <ul className="flex flex-col xl:m-0">
          {transferPortalEntries.map((entry: any) => (
            <li key={entry._id}>
              <div className="grid items-center p-0 border-b border-b-border grid-areas-row grid-cols-row">
                {/* Player Image */}
                <ImageComponent
                  image={entry.player.image}
                  alt={entry.player.name}
                  className="rounded grid-in-avatar h-[90px] w-[90px] my-4 mx-0 justify-self-center"
                  width={90}
                  height={90}
                />
                {/* Player Position */}
                <span className="grid-in-position text-center text-xs self-start xl:self-center xl:justify-self-center">{entry.player.position}</span>
                {/* Player Details */}
                <div className="grid-in-details xl:my-4 xl:mx-0">
                  <div className="flex flex-wrap items-center gap-1 text-base font-semibold italic leading-tight tracking-wide">
                    {entry.player.name}
                  </div>
                  <div className="flex gap-1">
                    <span className="text-center text-xs font-normal leading-normal tracking-wider after:ml-1 after:content-['/']">-</span>
                    <span className="text-center text-xs font-normal leading-normal tracking-wider after:ml-1 after:content-['/']">{`${entry.player.height.feet}-${entry.player.height.inches}`}</span>
                    <span className="text-center text-xs font-normal leading-normal tracking-wider">{entry.player.weight}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-1">
                    <span className="text-center text-xs font-normal leading-normal tracking-wider">{entry.player.highSchool}</span>
                    <span className="text-center text-xs font-normal leading-normal tracking-wider">{`(${entry.player.homeTown.city}, ${entry.player.homeTown.state})`}</span>
                  </div>
                </div>
                {/* Player's Current Status */}
                <div className="grid-in-current">
                  <div className="flex py-1 px-2 bg-secondary rounded items-center gap-3">
                    <div className="flex items-center">
                      {entry.transferStatus === 'Entered' && (
                        <ArrowRightToLine className="h-5 w-5" />
                      )}
                      {entry.transferStatus === 'Committed' && (
                        <CheckCircle className="h-5 w-5" />
                      )}
                      {entry.transferStatus === 'Signed' && (
                        <Edit3 className="h-5 w-5 text-emerald-500" />
                      )}
                      {entry.transferStatus === 'Withdrawn' && (
                        <ArrowLeftToLine className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <span className="text-xs font-semibold leading-[0.75] uppercase tracking-wide text-primary">{entry.transferStatus}</span>
                  </div>
                </div>
                {/* Player's Status */}
                <div className="grid-in-status grid grid-areas-status grid-cols-status gap-0 items-center justify-items-start xl:border-t-0 sm:pt-p sm:mt-0 sm:border-none">
                  <div className="grid-in-last flex items-center justify-center">
                    <ImageComponent
                      image={entry.transferringFrom.image}
                      alt={entry.transferringFrom.name}
                      width={32}
                      height={32}
                      className="h-8 w-8"
                    />
                  </div>
                  <MoveRight className="grid-in-arrow h-8 w-8" />
                  <div className="grid-in-new flex items-center gap-2">
                    <div className="xl:py-5 xl:px-2.5 w-fit rounded m-0">
                      <ImageComponent
                        image={entry.transferringTo.image}
                        alt={entry.transferringTo.name}
                        width={48}
                        height={48}
                        className="h-12 w-12"
                      />
                    </div>
                    <span className="text-xs font-semibold leading-[0.75] tracking-wide xl:hidden">{entry.transferringTo.name}</span>
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
