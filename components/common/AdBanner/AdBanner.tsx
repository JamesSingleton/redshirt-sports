import { useEffect, FC } from 'react'

declare global {
  interface Window {
    adsbygoogle: { [key: string]: unknown }[]
  }
}

const AdBanner: FC = () => {
  const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID
  useEffect(() => {
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (err) {
      console.log(err)
    }
  }, [])
  return (
    <ins
      className="adsbygoogle adbanner-customize"
      style={{
        display: 'block',
      }}
      data-ad-client={ADSENSE_ID}
      data-ad-slot="9178230911"
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  )
}

export default AdBanner
