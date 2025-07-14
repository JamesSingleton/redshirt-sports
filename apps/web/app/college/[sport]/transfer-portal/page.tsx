import './transfer-portal.css'
import { CircleCheckBigIcon, MoveRightIcon } from 'lucide-react'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { sanityFetch } from '@/lib/sanity/live'
import { sportInfoBySlug } from '@/lib/sanity/query'
import { getSEOMetadata } from '@/lib/seo'

import type { Metadata } from 'next'

async function fetchSportTitle(sport: string, { stega = true } = {}) {
  return await sanityFetch({
    query: sportInfoBySlug,
    params: {
      slug: sport,
    },
    stega,
  })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string }>
}): Promise<Metadata> {
  const { sport } = await params
  const { data: sportInfo } = await fetchSportTitle(sport)

  const title = `College ${sportInfo?.title} Transfer Portal`
  const description = `The latest ${sportInfo?.title} transfer portal updates and news.`
  const canonicalUrl = `/college/${sport}/transfer-portal`

  return getSEOMetadata({
    title,
    description,
    slug: canonicalUrl,
  })
}

export default async function TransferPortalPage({
  params,
}: {
  params: Promise<{ sport: string }>
}) {
  const { sport } = await params
  const { data: sportInfo } = await fetchSportTitle(sport)

  return (
    <div className="container">
      <section>
        <div className="py-12">
          <h1 className="text-3xl font-black">{`College ${sportInfo?.title} Transfer Portal`}</h1>
        </div>
        <div>
          <div className="border-border player-grid sticky hidden items-end justify-center border-b text-sm font-semibold lg:grid">
            <span className="[grid-area:player]">Player</span>
            <span className="[grid-area:position]">Position</span>
            <span className="[grid-area:player-status]">Status</span>
            <div className="grid grid-cols-2 gap-2.5 [grid-area:team-status]">
              <span>Last Team</span>
              <span>New Team</span>
            </div>
          </div>
        </div>
        <ol className="flex flex-col gap-3 lg:gap-0">
          <li>
            <div className="individual-player grid p-3 lg:px-0">
              <img
                className="size-12 justify-self-center rounded-md object-cover [grid-area:avatar] md:size-16 lg:size-20"
                src="https://on3static.com/cdn-cgi/image/height=90,width=90,quality=95,fit=cover/uploads/assets/974/388/388974.png"
                alt="Player Image"
              />
              <span className="m-0 text-center text-sm [grid-area:position] md:mt-2.5 lg:mt-0">
                DL
              </span>
              <div className="[grid-area:details]">
                <div className="flex flex-wrap items-center gap-1 font-semibold">
                  Aaron Beckwith
                </div>
                <div className="text-muted-foreground flex gap-0.5 text-center text-sm font-normal whitespace-nowrap">
                  <span className="after:ml-1 after:content-['/']">RS-JR</span>
                  <span className="after:ml-1 after:content-['/']">6-3</span>
                  <span>270</span>
                </div>
                <div className="text-muted-foreground mb-0.5 flex flex-row items-center justify-start gap-1 text-sm font-normal">
                  Northwest (Germantown, MD)
                </div>
              </div>
              <div className="mt-6 grid gap-2.5 pt-3 [grid-area:playerStatus]">
                <div className="border-input bg-background inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium whitespace-nowrap [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0">
                  <CircleCheckBigIcon />
                  Enrolled
                </div>
              </div>
              <div className="flex items-center justify-items-start gap-2.5 [grid-area:teamStatus] md:grid md:grid-cols-[1fr_1fr] md:gap-2.5">
                <div className="flex flex-row flex-nowrap items-center justify-start gap-1.5">
                  <div className="flex items-center justify-center lg:justify-start">
                    <img
                      src="https://on3static.com/uploads/assets/20/150/150020.svg"
                      alt="UMass School Logo"
                      className="size-8"
                    />
                  </div>
                  <MoveRightIcon className="size-8" />
                </div>
                <div>
                  <img
                    src="https://on3static.com/uploads/assets/960/424/424960.png"
                    alt="Temple Logo"
                    className="flex size-12 flex-row flex-nowrap items-center justify-start gap-0"
                  />
                </div>
              </div>
            </div>
          </li>
        </ol>
      </section>
    </div>
  )
}
