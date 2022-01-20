import { FC, useState } from 'react'
import Image from 'next/image'
import { PlayIcon, PauseIcon } from '@heroicons/react/solid'
import ReactPlayer from 'react-player'
import type { Podcast } from '@lib/types/podcast'
import FCSNationLogo from '../../../public/images/FCS_Nation_Logo.jpeg'

interface PodcastProps {
  podcast: Podcast
}

const PodcastCard: FC<PodcastProps> = ({ podcast }) => {
  const [playing, setPlaying] = useState(false)
  return (
    <div className="relative flex group items-center p-3 h-full border border-slate-200 dark:border-slate-700 rounded-md hover:border-transparent hover:shadow-lg dark:hover:bg-slate-800">
      <div className="w-1/4 shrink-0">
        <div className="h-0 aspect-w-1 aspect-h-1 relative rounded-md overflow-hidden shadow-lg">
          <div className="absolute inset-0">
            <Image
              src={FCSNationLogo}
              className="object-cover w-full h-full"
              alt="FCS Nation Logo"
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col grow ml-4">
        <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-50">
          {podcast.title}
        </h3>
        <span className="text-xs mt-1">{`Season ${podcast.itunes.season} · Episode ${podcast.itunes.episode}`}</span>
        <div>
          <div className="inline-flex items-center mt-3 pr-4 py-0.5 cursor-pointer rounded-full transition-all hover:pl-0.5 hover:bg-slate-100 dark:hover:bg-slate-900">
            <button className="flex items-center justify-center rounded-full">
              {playing ? (
                <PauseIcon
                  className="text-red-500 w-14 h-14"
                  onClick={() => setPlaying(false)}
                />
              ) : (
                <PlayIcon
                  className="text-red-500 w-14 h-14"
                  onClick={() => setPlaying(true)}
                />
              )}
              <ReactPlayer
                url={podcast.enclosure.url}
                playing={playing}
                width="0"
                height="0"
              />
            </button>
            <span className="ml-3 text-sm font-medium">Listen now</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PodcastCard
