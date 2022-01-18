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
    <>
      <div className="relative flex flex-col h-full">
        <div className="flex-shrink-0 relative w-full rounded-md overflow-hidden aspect-w-3 xl:aspect-w-4 aspect-h-3">
          <div>
            <Image
              className="object-cover w-full h-full"
              src={FCSNationLogo}
              alt="FCS Nation Radio Logo"
            />
          </div>
          <span className="bg-slate-900 bg-opacity-30" />
        </div>
        <div className="transform -mt-32">
          <div className="px-5 flex items-center space-x-4">
            <div className="flex-grow">
              <ReactPlayer
                url={podcast.enclosure.url}
                playing={playing}
                width="0"
                height="0"
              />
            </div>
            <div className="">
              <button>
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
              </button>
            </div>
          </div>
          <div className="p-5 mt-5 bg-white dark:bg-neutral-900 shadow-xl dark:shadow-2xl rounded-3xl rounded-tl-none flex flex-col flex-grow">
            <h2 className="line-clamp-1 block text-xl font-semibold text-slate-900 dark:text-slate-50">
              {podcast.title}
            </h2>
            <span
              className="text-sm mt-3 mb-5 line-clamp-2"
              dangerouslySetInnerHTML={{ __html: podcast.itunes.summary }}
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default PodcastCard
