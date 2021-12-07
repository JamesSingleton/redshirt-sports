import { useEffect, FC } from 'react'

declare global {
  interface Window {
    adsbygoogle: { [key: string]: unknown }[]
  }
}

const AdBanner: FC = () => {
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
      data-ad-client="ca-pub-8360890643217349"
      data-ad-slot=""
    />
  )
}

export default AdBanner
