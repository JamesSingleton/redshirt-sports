import { useEffect, FC } from 'react'

declare global {
  interface Window {
    adsbygoogle: { [key: string]: unknown }[]
  }
}

interface AdBannerProps {
  adSlot: number
}

const AdBanner: FC<AdBannerProps> = ({ adSlot }) => {
  const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    }
  }, [])
  return (
    <ins
      className="adsbygoogle adbanner-customize"
      style={{
        display: 'block',
      }}
      data-ad-client={ADSENSE_ID}
      data-ad-slot={adSlot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  )
}

export default AdBanner
