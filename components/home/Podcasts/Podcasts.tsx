import { FC } from 'react'
import PodcastCard from './PodcastCard'
import type { Podcast } from '@lib/types/podcast'

interface PodcastsProps {
  podcasts: Podcast[]
}

const Podcasts: FC<PodcastsProps> = ({ podcasts }) => {
  return (
    <div className="py-16 lg:py-28">
      <div className="relative flex flex-col sm:flex-row sm:items-end justify-between mb-12 md:mb-16">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 dark:text-slate-50">
            Latest Podcasts from FCS Nation Radio
          </h2>
          <span className="mt-2 md:mt-3 font-normal block text-base sm:text-xl">
            The only nationally syndicated radio show about the Football
            Championship Subdivision. Heard on better radio stations from Maine
            to Spokane.
          </span>
        </div>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {podcasts.map((podcast) => (
          <PodcastCard podcast={podcast} key={podcast.title} />
        ))}
      </div>
    </div>
  )
}

export default Podcasts
