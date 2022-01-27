import { FC } from 'react'
import PodcastCard from './PodcastCard'
import type { Podcast } from '@lib/types/podcast'

interface PodcastsProps {
  podcasts: Podcast[]
}

const Podcasts: FC<PodcastsProps> = ({ podcasts }) => {
  return (
    <div className="py-16 lg:py-28">
      <div className="relative mb-12 flex flex-col justify-between sm:flex-row sm:items-end md:mb-16">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold text-slate-900 dark:text-slate-50 md:text-4xl">
            Latest Podcasts from FCS Nation Radio
          </h2>
          <span className="mt-2 block text-base font-normal sm:text-xl md:mt-3">
            The only nationally syndicated radio show about the Football
            Championship Subdivision. Heard on better radio stations from Maine
            to Spokane.
          </span>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-3">
        {podcasts.map((podcast) => (
          <PodcastCard podcast={podcast} key={podcast.title} />
        ))}
      </div>
    </div>
  )
}

export default Podcasts
