import { FC, useState } from 'react'
import Image from 'next/image'
import { PlayIcon, PauseIcon } from '@heroicons/react/solid'
import ReactPlayer from 'react-player'
import type { Podcast } from '@lib/types/podcast'

interface PodcastProps {
  podcast: Podcast
}

const PodcastCard: FC<PodcastProps> = ({ podcast }) => {
  const [playing, setPlaying] = useState(false)
  return (
    <div className="group relative flex h-full items-center rounded-md border border-slate-200 p-3 hover:border-transparent hover:shadow-lg dark:border-slate-700 dark:hover:bg-slate-800">
      <div className="w-1/4 shrink-0">
        <div>
          <Image
            src="/images/FCS_Nation_Logo.jpeg"
            className="h-full w-full rounded-md object-cover"
            alt="FCS Nation Logo"
            width={113.5}
            height={113.5}
          />
        </div>
      </div>
      <div className="ml-4 flex grow flex-col">
        <h3 className="text-lg font-semibold text-slate-900 line-clamp-1 dark:text-slate-50">
          {podcast.title}
        </h3>
        <span className="mt-1 text-xs">{`Season ${podcast.itunes.season} · Episode ${podcast.itunes.episode}`}</span>
        <div>
          <div className="">
            <button
              onClick={() => setPlaying(!playing)}
              className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-full py-0.5 pr-4 transition-all hover:bg-slate-100 hover:pl-0.5 dark:hover:bg-slate-900"
            >
              {playing ? (
                <PauseIcon className="h-14 w-14 text-red-500" />
              ) : (
                <PlayIcon className="h-14 w-14 text-red-500" />
              )}
              <ReactPlayer
                url={podcast.enclosure.url}
                playing={playing}
                width="0"
                height="0"
              />
              <span className="ml-3 text-sm font-medium">Listen now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PodcastCard
