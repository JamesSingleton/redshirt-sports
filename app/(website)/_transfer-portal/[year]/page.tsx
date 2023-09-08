import { MoveRight, CheckCircle, ArrowLeftToLine, ArrowRightToLine, Edit3 } from 'lucide-react'

import { getTransferPortalPlayers } from '@lib/sanity.fetch'
import { ImageComponent } from '@components/ui'
import { FilterBar } from '@components/common/FilterBar'

export default async function Page({ params }: { params: { year: string } }) {
  const { year } = params
  const transferPortalEntries = await getTransferPortalPlayers()

  return (
    <section>
      <div className="pb-12 md:pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-12 md:max-w-5xl lg:max-w-7xl lg:px-8">
          <div className="mt-6 text-center sm:text-left md:text-left">
            <h1 className="text-3xl font-medium tracking-normal sm:text-4xl md:tracking-wider lg:text-5xl lg:leading-tight">
              {`${year} College Football Transfer Portal`}
            </h1>
            <p className="mt-4 font-serif text-base text-zinc-700 dark:text-zinc-200">
              Redshirt Sports diligently tracks the NCAA Transfer Portal, ensuring you stay informed
              about college athletes making transfers. Our platform provides valuable insights into
              the previous and new schools of these players, enabling you to keep up with the latest
              transfer news. Trust Redshirt Sports for comprehensive coverage of the transfer
              portal.
            </p>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="pb-12">
          <FilterBar />
        </div>
        <div className="hidden grid-cols-header border-b-2 border-border grid-areas-header md:grid">
          <span className="text-sm font-semibold leading-normal tracking-wide grid-in-player">
            Player
          </span>
          <span className="justify-self-center grid-in-position" aria-label="Position">
            Pos
          </span>
          <span className="grid-in-current">Status</span>
          <span className="grid-in-last">Last Team</span>
          <span className="grid-in-new">New Team</span>
        </div>
        <ul className="flex flex-col space-y-4 sm:space-y-0 xl:m-0">
          {transferPortalEntries.map((entry: any) => (
            <li key={entry._id}>
              <div className="grid grid-cols-row-xs items-center border-b border-border py-4 grid-areas-row-xs sm:p-0 sm:grid-areas-row-sm md:grid-cols-row md:grid-areas-row">
                {/* Player Image */}
                <ImageComponent
                  image={entry.player.image}
                  alt={entry.player.name}
                  className="h-12 w-12 justify-self-center rounded grid-in-avatar md:mx-0 md:my-4 md:h-[90px] md:w-[90px]"
                  width={90}
                  height={90}
                />
                {/* Player Position */}
                <span className="self-start text-center text-sm leading-normal tracking-normal grid-in-position md:self-center md:justify-self-center">
                  {entry.player.position}
                </span>
                {/* Player Details */}
                <div className="grid-in-details xl:mx-0 xl:my-4">
                  <div className="flex flex-wrap items-center gap-1 text-base font-semibold italic leading-tight tracking-wide">
                    {entry.player.name}
                  </div>
                  <div className="flex gap-1">
                    <span className="text-center text-sm font-normal leading-normal tracking-wider after:ml-1 after:content-['/']">
                      {entry.classYear ?? '-'}
                    </span>
                    <span className="text-center text-sm font-normal leading-normal tracking-wider after:ml-1 after:content-['/']">{`${entry.player.height.feet}-${entry.player.height.inches}`}</span>
                    <span className="text-center text-sm font-normal leading-normal tracking-wider">
                      {entry.player.weight}
                    </span>
                  </div>
                  <div className="mb-1 flex flex-wrap gap-x-1">
                    <span className="text-center text-sm font-normal leading-normal tracking-wider">
                      {entry.player.highSchool}
                    </span>
                    <span className="text-center text-sm font-normal leading-normal tracking-wider">{`(${entry.player.homeTown.city}, ${entry.player.homeTown.state})`}</span>
                  </div>
                </div>
                {/* Player's Current Status */}
                <div className="mb-4 grid-in-current">
                  <div className="flex items-center gap-2 rounded bg-secondary px-2 py-1">
                    <div className="flex items-center">
                      {entry.transferStatus === 'Entered' && (
                        <ArrowRightToLine className="h-5 w-5" />
                      )}
                      {entry.transferStatus === 'Committed' && <CheckCircle className="h-5 w-5" />}
                      {entry.transferStatus === 'Signed' && (
                        <Edit3 className="h-5 w-5 text-emerald-500" />
                      )}
                      {entry.transferStatus === 'Withdrawn' && (
                        <ArrowLeftToLine className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <span className="text-sm font-semibold uppercase leading-[0.75] tracking-wide text-primary">
                      {entry.transferStatus}
                    </span>
                  </div>
                </div>
                {/* Player's Status */}
                <div className="mt-4 grid grid-cols-status-xs items-center justify-items-start gap-x-2 pt-2 grid-areas-status grid-in-status sm:mt-0 sm:border-none sm:pt-0 md:grid-cols-status xl:border-t-0">
                  <div className="flex items-center justify-center grid-in-last">
                    <ImageComponent
                      image={entry.transferringFrom.image}
                      alt={entry.transferringFrom.name}
                      width={32}
                      height={32}
                      className="h-8 w-8"
                    />
                  </div>
                  <MoveRight className="h-8 w-8 grid-in-arrow" />
                  <div className="flex items-center gap-2 grid-in-new">
                    <div className="m-0 flex aspect-1 h-12 w-12 items-center rounded">
                      <ImageComponent
                        image={entry.transferringTo.image}
                        alt={entry.transferringTo.name}
                        width={48}
                        height={48}
                        mode="contain"
                      />
                    </div>
                    <span className="text-sm font-semibold leading-[0.75] tracking-wide md:hidden">
                      {entry.transferringTo.name}
                    </span>
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
