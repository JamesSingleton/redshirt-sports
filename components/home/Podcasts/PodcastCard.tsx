import { FC } from 'react'
import Image from 'next/image'
import FCSNationLogo from '../../../public/images/FCS_Nation_Logo.jpeg'

const PodcastCard: FC = () => {
  return (
    <div className="relative flex flex-col h-full">
      <div className="flex-shrink-0 relative w-full rounded-md overflow-hidden aspect-w-3 xl:aspect-w-4 aspect-h-3">
        <Image
          className="object-cover w-full h-full"
          src={FCSNationLogo}
          alt="FCS Nation Radio Logo"
        />
      </div>
      <div className="transform -mt-32"></div>
    </div>
  )
}

export default PodcastCard
