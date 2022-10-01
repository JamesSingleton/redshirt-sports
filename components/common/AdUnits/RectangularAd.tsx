import { useEffect } from 'react'

const RectangularAd = ({ client, slot }: { client: string; slot: string }) => {
  useEffect(() => {
    ;(window.adsbygoogle = window.adsbygoogle || []).push({})
  }, [])

  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl px-4 sm:px-6 md:max-w-3xl md:px-8 lg:max-w-none lg:px-0">
      <span className="sr-only">Advertisement</span>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="rectangle"
        data-full-width-responsive="true"
      />
    </div>
  )
}

export default RectangularAd
