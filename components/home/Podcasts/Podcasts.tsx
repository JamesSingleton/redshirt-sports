import { FC } from 'react'
import Image from 'next/image'
import { usePlausible } from 'next-plausible'

const Podcasts: FC = () => {
  const plausible = usePlausible()
  return (
    <div className="bg-white rounded-lg shadow">
      <h2 className="h-11 mx-3 flex items-center justify-between text-base font-medium text-gray-900 border-b border-gray-300">
        Podcasts
      </h2>
      <div className="mt-6 flex flex-col overflow-hidden rounded-b-lg">
        <div className="shrink-0 text-center">
          <Image
            src="/images/FCS_Nation_Logo.jpeg"
            alt="FCS Nation Logo"
            width="176"
            height="176"
          />
        </div>
        <div className="grid grid-cols-2 mb-6">
          <a
            href="https://podcasts.apple.com/us/podcast/fcs-nation/id1436799349?mt=2&ls=1"
            target="_blank"
            rel="noreferrer"
            onClick={() => plausible('clickApplePodcast')}
          >
            <Image
              src="/images/US_UK_Apple_Podcasts_Listen_Badge_RGB.svg"
              height="38"
              width="185"
              alt="Listen on Apple Podcasts"
              quality="65"
              layout="responsive"
            />
          </a>
          <a
            href="https://www.stitcher.com/show/fcs-nation"
            target="_blank"
            rel="noreferrer"
            onClick={() => plausible('clickStitcherPodcast')}
          >
            <Image
              src="/images/stitcher_logo.svg"
              height="38"
              width="185"
              alt="Listen on Stitcher"
              quality="65"
              layout="responsive"
            />
          </a>
        </div>
      </div>
    </div>
  )
}

export default Podcasts